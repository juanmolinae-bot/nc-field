/* Pruebas UNITARIAS del motor de estados.
   No tocan la base ni la API: ejercen la función validarTransicion en
   aislamiento. Son la contraparte de las pruebas de integración de nc.test.js,
   que sí golpean la API y PostgreSQL reales.

   La distinción importa para la rúbrica (certificación de calidad):
   - unitaria  = una función, sin dependencias externas  → este archivo
   - integración = varias piezas juntas (API + motor + base) → nc.test.js */

const { validarTransicion, TRANSICIONES } = require('../src/estados');

describe('Motor de estados · transiciones válidas', () => {
  test('PEM puede abrir el tratamiento de una NC abierta', () => {
    expect(validarTransicion('abierta', 'en_tratamiento', 'pem').ok).toBe(true);
  });

  test('el contratista declara el tratamiento ejecutado', () => {
    expect(validarTransicion('en_tratamiento', 'verificacion', 'contratista').ok).toBe(true);
  });

  test('calidad cierra una NC en verificación', () => {
    expect(validarTransicion('verificacion', 'cerrada', 'qaqc').ok).toBe(true);
  });

  test('calidad puede devolver a tratamiento si la verificación falla', () => {
    expect(validarTransicion('verificacion', 'en_tratamiento', 'qaqc').ok).toBe(true);
  });

  test('el administrador puede ejecutar cualquier transición definida', () => {
    expect(validarTransicion('abierta', 'en_tratamiento', 'admin').ok).toBe(true);
    expect(validarTransicion('verificacion', 'cerrada', 'admin').ok).toBe(true);
  });
});

describe('Motor de estados · transiciones inválidas por estado', () => {
  test('no existe salto directo de abierta a cerrada', () => {
    const r = validarTransicion('abierta', 'cerrada', 'admin');
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/no es valida/);
  });

  test('una NC cerrada no admite más transiciones', () => {
    expect(validarTransicion('cerrada', 'abierta', 'admin').ok).toBe(false);
  });

  test('una NC rechazada es terminal', () => {
    expect(validarTransicion('rechazada', 'en_tratamiento', 'admin').ok).toBe(false);
  });

  test('no se puede saltar de abierta a verificación', () => {
    expect(validarTransicion('abierta', 'verificacion', 'pem').ok).toBe(false);
  });
});

describe('Motor de estados · transiciones inválidas por rol', () => {
  test('el contratista no puede asignar tratamiento', () => {
    const r = validarTransicion('abierta', 'en_tratamiento', 'contratista');
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/no puede ejecutar/);
  });

  test('el contratista no puede cerrar una NC', () => {
    expect(validarTransicion('verificacion', 'cerrada', 'contratista').ok).toBe(false);
  });

  test('el PEM no declara el tratamiento por el contratista', () => {
    expect(validarTransicion('en_tratamiento', 'verificacion', 'pem').ok).toBe(false);
  });

  test('el contratista no puede rechazar una NC', () => {
    expect(validarTransicion('abierta', 'rechazada', 'contratista').ok).toBe(false);
  });
});

describe('Motor de estados · integridad de la tabla de transiciones', () => {
  test('los estados terminales no tienen salidas', () => {
    expect(Object.keys(TRANSICIONES.cerrada)).toHaveLength(0);
    expect(Object.keys(TRANSICIONES.rechazada)).toHaveLength(0);
  });

  test('todo estado destino es un estado conocido', () => {
    const estados = new Set(['abierta', 'en_tratamiento', 'verificacion', 'cerrada', 'rechazada']);
    for (const desde of Object.keys(TRANSICIONES)) {
      for (const hasta of Object.keys(TRANSICIONES[desde])) {
        expect(estados.has(hasta)).toBe(true);
      }
    }
  });

  test('toda transición declara al menos un rol autorizado', () => {
    for (const desde of Object.keys(TRANSICIONES)) {
      for (const hasta of Object.keys(TRANSICIONES[desde])) {
        expect(TRANSICIONES[desde][hasta].length).toBeGreaterThan(0);
      }
    }
  });
});
