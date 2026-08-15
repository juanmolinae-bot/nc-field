const request = require('supertest');
const { randomUUID } = require('crypto');
const app = require('../src/app');
const pool = require('../src/db/pool');

let tokenPem, tokenContra, tokenQaqc;

beforeAll(async () => {
  const login = async (username, password) => {
    const r = await request(app).post('/api/auth/login').send({ username, password });
    return r.body.token;
  };
  tokenPem = await login('pem1', 'pem1234');
  tokenContra = await login('contra1', 'contratista1234');
  tokenQaqc = await login('qaqc1', 'qaqc1234');
});

afterAll(async () => { await pool.end(); });

describe('Seguridad: autenticacion y roles', () => {
  test('sin token -> 401', async () => {
    const r = await request(app).get('/api/nc');
    expect(r.status).toBe(401);
  });

  test('token invalido -> 401', async () => {
    const r = await request(app).get('/api/nc').set('Authorization', 'Bearer basura');
    expect(r.status).toBe(401);
  });

  test('contratista pidiendo dashboard -> 403', async () => {
    const r = await request(app).get('/api/nc/dashboard')
      .set('Authorization', `Bearer ${tokenContra}`);
    expect(r.status).toBe(403);
  });

  test('pem pidiendo dashboard -> 200', async () => {
    const r = await request(app).get('/api/nc/dashboard')
      .set('Authorization', `Bearer ${tokenPem}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty('resumen');
  });
});

describe('Sincronizacion offline idempotente (uuid_offline)', () => {
  test('misma NC enviada dos veces -> duplicada=true, sin folio nuevo', async () => {
    const nc = {
      uuid_offline: randomUUID(),
      titulo: 'Disco de ruptura GIS J23 con deflector abierto',
      descripcion: 'Deflector del disco de ruptura orientado hacia pasillo de operacion',
      tag_equipo: '220kV GIS J23',
      severidad: 'mayor',
      norma_ref: 'IEC 62271-203',
    };
    const r1 = await request(app).post('/api/nc')
      .set('Authorization', `Bearer ${tokenPem}`).send(nc);
    expect(r1.status).toBe(201);
    expect(r1.body.duplicada).toBe(false);

    const r2 = await request(app).post('/api/nc')
      .set('Authorization', `Bearer ${tokenPem}`).send(nc);
    expect(r2.status).toBe(200);
    expect(r2.body.duplicada).toBe(true);
    expect(r2.body.folio).toBe(r1.body.folio);   // mismo folio, no se creo otra
  });
});

describe('Motor de estados', () => {
  let ncId;
  beforeAll(async () => {
    const r = await request(app).post('/api/nc')
      .set('Authorization', `Bearer ${tokenPem}`)
      .send({
        uuid_offline: randomUUID(),
        titulo: 'Bloque de pruebas CT sin identificar',
        descripcion: 'Regleta de secundarios de CT sin TAG en LCC',
        severidad: 'menor',
      });
    ncId = r.body.id;
  });

  test('abierta -> cerrada directa: rechazada por el motor (409)', async () => {
    const r = await request(app).patch(`/api/nc/${ncId}/estado`)
      .set('Authorization', `Bearer ${tokenPem}`)
      .send({ estado_nuevo: 'cerrada' });
    expect(r.status).toBe(409);
  });

  test('contratista no puede pasar abierta -> en_tratamiento (409)', async () => {
    const r = await request(app).patch(`/api/nc/${ncId}/estado`)
      .set('Authorization', `Bearer ${tokenContra}`)
      .send({ estado_nuevo: 'en_tratamiento' });
    expect(r.status).toBe(409);
  });

  test('flujo completo valido: abierta -> en_tratamiento -> verificacion -> cerrada', async () => {
    let r = await request(app).patch(`/api/nc/${ncId}/estado`)
      .set('Authorization', `Bearer ${tokenPem}`)
      .send({ estado_nuevo: 'en_tratamiento', comentario: 'Asignada a contratista' });
    expect(r.status).toBe(200);

    r = await request(app).patch(`/api/nc/${ncId}/estado`)
      .set('Authorization', `Bearer ${tokenContra}`)
      .send({ estado_nuevo: 'verificacion', comentario: 'TAG instalado' });
    expect(r.status).toBe(200);

    r = await request(app).patch(`/api/nc/${ncId}/estado`)
      .set('Authorization', `Bearer ${tokenQaqc}`)
      .send({ estado_nuevo: 'cerrada', comentario: 'Verificado en terreno' });
    expect(r.status).toBe(200);
    expect(r.body.estado_nuevo).toBe('cerrada');
  });

  test('la bitacora registro cada transicion', async () => {
    const r = await request(app).get(`/api/nc/${ncId}/historial`)
      .set('Authorization', `Bearer ${tokenPem}`);
    const cadena = r.body.map(h => h.estado_hasta);
    expect(cadena).toEqual(['abierta', 'en_tratamiento', 'verificacion', 'cerrada']);
  });
});

describe('Inmutabilidad de la bitacora (trigger en la base)', () => {
  test('UPDATE directo a historial_estado -> bloqueado por trigger', async () => {
    await expect(
      pool.query("UPDATE historial_estado SET comentario = 'alterado' WHERE id = 1")
    ).rejects.toThrow(/solo-insercion/);
  });

  test('DELETE directo a historial_estado -> bloqueado por trigger', async () => {
    await expect(
      pool.query('DELETE FROM historial_estado WHERE id = 1')
    ).rejects.toThrow(/solo-insercion/);
  });
});

describe('No existe DELETE de NC', () => {
  test('DELETE /api/nc/:id -> 404 (la ruta no existe por diseño)', async () => {
    const r = await request(app).delete('/api/nc/1')
      .set('Authorization', `Bearer ${tokenPem}`);
    expect(r.status).toBe(404);
  });
});
