const BASE = import.meta.env.VITE_API || 'http://localhost:3000';
const CLAVE_COLA = 'ncfield.cola';
const CLAVE_SESION = 'ncfield.sesion';

// --- sesion
export const leerSesion = () => {
  try { return JSON.parse(localStorage.getItem(CLAVE_SESION)); } catch { return null; }
};
export const guardarSesion = (s) => localStorage.setItem(CLAVE_SESION, JSON.stringify(s));
export const borrarSesion = () => localStorage.removeItem(CLAVE_SESION);

// --- fetch
async function pedir(ruta, opciones = {}) {
  const sesion = leerSesion();
  const r = await fetch(BASE + ruta, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(sesion?.token ? { Authorization: `Bearer ${sesion.token}` } : {}),
      ...opciones.headers,
    },
  });
  let cuerpo = null;
  try { cuerpo = await r.json(); } catch { /* respuesta sin cuerpo */ }
  if (!r.ok) {
    const e = new Error(cuerpo?.error || `Error ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return cuerpo;
}

export const login = (username, password) =>
  pedir('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const listarNC = () => pedir('/api/nc');
export const verNC = (id) => pedir(`/api/nc/${id}`);
export const verHistorial = (id) => pedir(`/api/nc/${id}/historial`);
export const verEvidencia = (id) => pedir(`/api/nc/${id}/evidencia`);
export const verTablero = () => pedir('/api/nc/dashboard');

export const cambiarEstado = (id, estado_nuevo, comentario) =>
  pedir(`/api/nc/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado_nuevo, comentario }) });

export const subirEvidencia = (id, nombre_arch, contenido_base64) =>
  pedir(`/api/nc/${id}/evidencia`, { method: 'POST', body: JSON.stringify({ nombre_arch, contenido_base64 }) });

// --- cola offline

export const leerCola = () => {
  try { return JSON.parse(localStorage.getItem(CLAVE_COLA)) || []; } catch { return []; }
};
const escribirCola = (c) => localStorage.setItem(CLAVE_COLA, JSON.stringify(c));

export function encolarNC(datos) {
  const cola = leerCola();
  const item = {
    uuid_offline: crypto.randomUUID(),
    datos,
    estado: 'en_cola',        // en_cola | enviada | duplicada | error
    folio: null,
    nc_id: null,
    detalle: null,
    creada_en: new Date().toISOString(),
  };
  cola.push(item);
  escribirCola(cola);
  return item;
}

export async function sincronizar() {
  const cola = leerCola();
  for (const item of cola) {
    if (item.estado === 'enviada' || item.estado === 'duplicada') continue;
    try {
      const r = await pedir('/api/nc', {
        method: 'POST',
        body: JSON.stringify({ uuid_offline: item.uuid_offline, ...item.datos }),
      });
      item.estado = r.duplicada ? 'duplicada' : 'enviada';
      item.folio = r.folio;
      item.nc_id = r.id;
      item.detalle = r.duplicada ? 'Duplicada — ya existía' : null;
    } catch (e) {
      item.estado = 'error';
      item.detalle = e.message;
    }
    escribirCola(cola);
  }
  return leerCola();
}

export const pendientes = () => leerCola().filter((i) => i.estado === 'en_cola' || i.estado === 'error').length;
export const vaciarSincronizadas = () =>
  escribirCola(leerCola().filter((i) => i.estado !== 'enviada' && i.estado !== 'duplicada'));
