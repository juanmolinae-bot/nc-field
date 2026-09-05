// Script para limpiar las NC de la base, dejando los usuarios intactos.
// Borra evidencias, historial y no conformidades, pero NO los usuarios.
const pool = require('./src/db/pool');

async function limpiar() {
  const client = await pool.connect();
  try {
    // El trigger bloquea DELETE en historial_estado. Hay que desactivarlo
    // temporalmente para poder limpiar, y despues reactivarlo.
    await client.query('ALTER TABLE historial_estado DISABLE TRIGGER trg_historial_inmutable');

    // Borrar en orden: primero las tablas que dependen de no_conformidad
    await client.query('DELETE FROM historial_estado');
    await client.query('DELETE FROM evidencia');
    await client.query('DELETE FROM no_conformidad');

    // Reactivar el trigger
    await client.query('ALTER TABLE historial_estado ENABLE TRIGGER trg_historial_inmutable');

    // Reiniciar el contador de folios si existe una secuencia
    await client.query("SELECT setval(pg_get_serial_sequence('no_conformidad','id'), 1, false)").catch(() => {});

    console.log('Base limpiada: NC, evidencias e historial borrados. Usuarios intactos.');
  } catch (e) {
    console.error('Error al limpiar:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

limpiar();
