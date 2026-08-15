# Trazabilidad — requisito → código → prueba

Cada historia de usuario del MVP, dónde se implementa en el código, y qué prueba
la verifica. Esta es la evidencia del criterio "trazabilidad de requerimiento
mostrando código donde es realizado".

---

## HU-01 · Autenticación con JWT

**Criterio de aceptación:** sin token válido la API responde 401; el token expira a las 8 h.

| Capa | Ubicación |
|------|-----------|
| Ruta | `src/routes/auth.js` → `POST /login`, firma el token con `expiresIn: '8h'` |
| Middleware | `src/middleware/auth.js` → `autenticar()`, responde 401 sin token válido |
| Cliente | `web/src/screens/Login.jsx` |
| Prueba | `tests/nc.test.js` → "sin token -> 401", "token invalido -> 401" |

---

## HU-02 · Levantar una NC en terreno

**Criterio de aceptación:** la NC se guarda en el equipo aunque no haya señal.

| Capa | Ubicación |
|------|-----------|
| Cliente | `web/src/screens/NuevaNC.jsx` → `guardar()` encola antes de intentar la red |
| Cola | `web/src/api.js` → `encolarNC()` genera el `uuid_offline` en el equipo |
| API | `src/routes/nc.js` → `POST /` |
| Prueba | `tests/nc.test.js` → creación dentro de "misma NC enviada dos veces" |

---

## HU-03 · Sincronización idempotente

**Criterio de aceptación:** sincronizar dos veces la misma NC no genera un folio nuevo.

| Capa | Ubicación |
|------|-----------|
| Base | `src/db/schema.sql` → `uuid_offline UUID UNIQUE NOT NULL` |
| API | `src/routes/nc.js` → `POST /`, rama de idempotencia + captura del error `23505` |
| Cliente | `web/src/api.js` → `sincronizar()` recorre la cola y marca duplicadas |
| Prueba | `tests/nc.test.js` → "misma NC enviada dos veces -> duplicada=true, sin folio nuevo" |

---

## HU-04 · Consultar y filtrar

**Criterio de aceptación:** filtro por folio, TAG, severidad y estado.

| Capa | Ubicación |
|------|-----------|
| API | `src/routes/nc.js` → `GET /` |
| Cliente | `web/src/screens/Listado.jsx` → filtro sobre folio, TAG, severidad y estado |
| Prueba | `tests/nc.test.js` → "pem pidiendo dashboard -> 200" (ejerce el listado autenticado) |

---

## HU-05 y HU-06 · Declarar tratamiento, verificar y cerrar

**Criterio de aceptación:** no existe transición directa de abierta a cerrada; cada
rol solo ejecuta las transiciones que le corresponden.

| Capa | Ubicación |
|------|-----------|
| Motor | `src/estados.js` → `validarTransicion()` y la tabla `TRANSICIONES` |
| API | `src/routes/nc.js` → `PATCH /:id/estado`, única vía de cambio de estado |
| Cliente | `web/src/screens/Detalle.jsx` → `ACCIONES` filtra los botones por rol |
| Prueba unitaria | `tests/estados.unit.test.js` → 16 casos de transición |
| Prueba integración | `tests/nc.test.js` → "abierta -> cerrada directa (409)", "flujo completo valido" |

---

## HU-07 · Tablero de indicadores

**Criterio de aceptación:** el contratista que solicita el tablero recibe 403.

| Capa | Ubicación |
|------|-----------|
| API | `src/routes/nc.js` → `GET /dashboard` con `permitir('pem','qaqc','admin')` |
| Middleware | `src/middleware/auth.js` → `permitir()` responde 403 |
| Cliente | `web/src/screens/Tablero.jsx` → maneja el 403 con una pantalla explicativa |
| Prueba | `tests/nc.test.js` → "contratista pidiendo dashboard -> 403" |

---

## HU-08 · Bitácora íntegra

**Criterio de aceptación:** la bitácora no admite UPDATE ni DELETE, tampoco desde la base.

| Capa | Ubicación |
|------|-----------|
| Base | `src/db/schema.sql` → trigger `trg_historial_inmutable` sobre `historial_estado` |
| API | `src/routes/nc.js` → inserta en `historial_estado` en cada transición |
| Cliente | `web/src/screens/Detalle.jsx` → muestra la bitácora, sin controles de edición |
| Prueba | `tests/nc.test.js` → "UPDATE ... bloqueado por trigger", "DELETE ... bloqueado por trigger" |

---

## Evidencia adicional de diseño

**No existe DELETE de una NC.** No es una omisión: es una decisión. `src/routes/nc.js`
no define la ruta, y la prueba "DELETE /api/nc/:id -> 404" lo verifica. Una NC se cierra
o se rechaza, nunca se borra, porque respalda una discusión contractual.
