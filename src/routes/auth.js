const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username y password requeridos' });

  const { rows } = await pool.query('SELECT * FROM usuario WHERE username = $1', [username]);
  if (rows.length === 0) return res.status(401).json({ error: 'Credenciales invalidas' });

  const usuario = rows[0];
  const ok = await bcrypt.compare(password, usuario.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });

  const token = jwt.sign(
    { id: usuario.id, username: usuario.username, rol: usuario.rol, nombre: usuario.nombre },
    SECRET,
    { expiresIn: '8h' }
  );
  return res.json({ token, rol: usuario.rol, nombre: usuario.nombre });
});

module.exports = router;
