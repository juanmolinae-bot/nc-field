const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const ncRoutes = require('./routes/nc');

const app = express();

// El cliente web corre en otro origen (Vite en :5173) durante el desarrollo.
app.use(cors({ origin: true }));
app.use(express.json({ limit: '12mb' }));   // las fotos de evidencia viajan en base64

app.get('/api/salud', (req, res) => res.json({ estado: 'ok', servicio: 'nc-field-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/nc', ncRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

module.exports = app;
