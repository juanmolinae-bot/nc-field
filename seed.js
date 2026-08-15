// Carga esquema y usuarios de prueba (uno por rol)
const fs = require('fs');
const bcrypt = require('bcrypt');
const pool = require('./src/db/pool');

(async () => {
  const schema = fs.readFileSync(__dirname + '/src/db/schema.sql', 'utf8');
  await pool.query(schema);
  const usuarios = [
    ['jmolina',  'admin1234',       'Juan Molina',    'admin'],
    ['pem1',     'pem1234',         'PEM Cristales',  'pem'],
    ['qaqc1',    'qaqc1234',        'QA/QC Proyecto', 'qaqc'],
    ['contra1',  'contratista1234', 'Contratista EM', 'contratista'],
  ];
  for (const [u, p, n, r] of usuarios) {
    const hash = await bcrypt.hash(p, 10);
    await pool.query(
      `INSERT INTO usuario (username, password_hash, nombre, rol)
       VALUES ($1,$2,$3,$4) ON CONFLICT (username) DO NOTHING`, [u, hash, n, r]);
  }
  console.log('Esquema y usuarios cargados');
  await pool.end();
})();
