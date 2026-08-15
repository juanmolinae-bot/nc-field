const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'ncfield',
  password: process.env.PGPASSWORD || 'ncfield_dev',
  database: process.env.PGDATABASE || 'ncfield_db',
  port: process.env.PGPORT || 5432,
});

module.exports = pool;
