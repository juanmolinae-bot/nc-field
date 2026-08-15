const express = require('express');
const crypto = require('crypto');
const pool = require('../db/pool');
const { autenticar, permitir } = require('../middleware/auth');
const { validarTransicion } = require('../estados');

const router = express.Router();
router.use(autenticar);

// Folio correlativo NC-YYYY-NNNN, calculado dentro de la transaccion.
async function siguienteFolio(client) {
  const anio = new Date().getFullYear();
  const { rows } = await client.query(
    "SELECT COUNT(*)::int AS n FROM no_conformidad WHERE folio LIKE $1", [`NC-${anio}-%`]);
  return `NC-${anio}-${String(rows[0].n + 1).padStart(4, '0')}`;
}

// POST /api/nc — crea una NC o devuelve la existente si el uuid ya esta
router.post('/', async (req, res) => {
  const { uuid_offline, titulo, descripcion, tag_equipo, severidad, norma_ref, responsable } = req.body || {};
  if (!uuid_offline || !titulo || !descripcion || !severidad) {
    return res.status(400).json({ error: 'uuid_offline, titulo, descripcion y severidad son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // si el uuid ya existe, devuelvo la NC sin crear otra
    const existente = await client.query(
      'SELECT folio, id, estado FROM no_conformidad WHERE uuid_offline = $1', [uuid_offline]);
    if (existente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(200).json({ duplicada: true, ...existente.rows[0] });
    }

    const folio = await siguienteFolio(client);
    const ins = await client.query(
      `INSERT INTO no_conformidad
         (folio, uuid_offline, titulo, descripcion, tag_equipo, severidad, norma_ref, responsable, creada_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, folio, estado`,
      [folio, uuid_offline, titulo, descripcion, tag_equipo || null, severidad,
       norma_ref || null, responsable || null, req.usuario.id]);

    await client.query(
      `INSERT INTO historial_estado (nc_id, estado_desde, estado_hasta, comentario, usuario_id)
       VALUES ($1, 'creacion', 'abierta', 'NC levantada', $2)`,
      [ins.rows[0].id, req.usuario.id]);

    await client.query('COMMIT');
    return res.status(201).json({ duplicada: false, ...ins.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    // si dos requests entran juntos, la UNIQUE de la base resuelve
    if (e.code === '23505' && e.constraint === 'no_conformidad_uuid_offline_key') {
      const { rows } = await pool.query(
        'SELECT folio, id, estado FROM no_conformidad WHERE uuid_offline = $1', [uuid_offline]);
      return res.status(200).json({ duplicada: true, ...rows[0] });
    }
    throw e;
  } finally {
    client.release();
  }
});

// GET /api/nc — listado (todos los roles autenticados)
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, folio, titulo, tag_equipo, severidad, estado, responsable, creada_en FROM no_conformidad ORDER BY id DESC');
  res.json(rows);
});

// GET /api/nc/dashboard — solo pem, qaqc y admin
router.get('/dashboard', permitir('pem', 'qaqc', 'admin'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT estado, severidad, COUNT(*)::int AS cantidad
     FROM no_conformidad GROUP BY estado, severidad ORDER BY estado, severidad`);
  res.json({ resumen: rows });
});

// PATCH /api/nc/:id/estado — unica via de cambio de estado, pasa por el motor.
router.patch('/:id/estado', async (req, res) => {
  const { estado_nuevo, comentario } = req.body || {};
  if (!estado_nuevo) return res.status(400).json({ error: 'estado_nuevo requerido' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const nc = await client.query(
      'SELECT id, estado FROM no_conformidad WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (nc.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'NC no existe' });
    }

    const v = validarTransicion(nc.rows[0].estado, estado_nuevo, req.usuario.rol);
    if (!v.ok) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: v.motivo });
    }

    await client.query('UPDATE no_conformidad SET estado = $1 WHERE id = $2',
      [estado_nuevo, req.params.id]);
    await client.query(
      `INSERT INTO historial_estado (nc_id, estado_desde, estado_hasta, comentario, usuario_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.params.id, nc.rows[0].estado, estado_nuevo, comentario || null, req.usuario.id]);
    await client.query('COMMIT');
    return res.json({ id: nc.rows[0].id, estado_anterior: nc.rows[0].estado, estado_nuevo });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// GET /api/nc/:id/historial — bitacora completa de la NC
router.get('/:id/historial', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT h.estado_desde, h.estado_hasta, h.comentario, h.registrado, u.nombre AS usuario
     FROM historial_estado h JOIN usuario u ON u.id = h.usuario_id
     WHERE h.nc_id = $1 ORDER BY h.id`, [req.params.id]);
  res.json(rows);
});

// POST /api/nc/:id/evidencia — el hash lo calcula el servidor, no el cliente
router.post('/:id/evidencia', async (req, res) => {
  const { nombre_arch, contenido_base64 } = req.body || {};
  if (!nombre_arch || !contenido_base64) {
    return res.status(400).json({ error: 'nombre_arch y contenido_base64 requeridos' });
  }
  const nc = await pool.query('SELECT id FROM no_conformidad WHERE id = $1', [req.params.id]);
  if (nc.rows.length === 0) return res.status(404).json({ error: 'NC no existe' });

  const buffer = Buffer.from(contenido_base64, 'base64');
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  const { rows } = await pool.query(
    `INSERT INTO evidencia (nc_id, nombre_arch, sha256, subida_por)
     VALUES ($1,$2,$3,$4) RETURNING id, nombre_arch, sha256, subida_en`,
    [req.params.id, nombre_arch, sha256, req.usuario.id]);
  res.status(201).json(rows[0]);
});

// GET /api/nc/:id/evidencia
router.get('/:id/evidencia', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT e.id, e.nombre_arch, e.sha256, e.subida_en, u.nombre AS subida_por
     FROM evidencia e JOIN usuario u ON u.id = e.subida_por
     WHERE e.nc_id = $1 ORDER BY e.id`, [req.params.id]);
  res.json(rows);
});

// GET /api/nc/:id — detalle de una NC
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT n.*, u.nombre AS creador FROM no_conformidad n
     JOIN usuario u ON u.id = n.creada_por WHERE n.id = $1`, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'NC no existe' });
  res.json(rows[0]);
});

// no hay DELETE — una NC no se borra, se cierra o se rechaza

module.exports = router;
