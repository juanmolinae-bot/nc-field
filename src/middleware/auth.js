const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar-en-prod';

// chequea el token, corta con 401 si falta o esta malo
function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.usuario = jwt.verify(token, SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}

// chequea el rol, 403 si no tiene permiso
function permitir(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: `Rol '${req.usuario.rol}' no autorizado para este recurso` });
    }
    return next();
  };
}

module.exports = { autenticar, permitir, SECRET };
