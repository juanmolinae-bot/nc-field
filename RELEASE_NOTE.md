# Release Note — NC-Field

## LB-H2 · v0.2.0 — Cliente web y motor de estados

**Fecha:** julio de 2026
**Línea base:** LB-H2-v0.2.0
**Responsable:** Juan Molina Escalante
**Estado:** liberada a los ambientes de desarrollo y pruebas

---

### Resumen

Esta versión cierra el Hito 2. Sobre lo que ya traía LB-H1 (API, autenticación y
bitácora inmutable), esta suma el motor de estados, la carga de evidencia con su
hash SHA-256, y el cliente web en React con las seis pantallas del diseño, de la
M1 a la M6. Con esto ya se puede llevar una NC por todo su ciclo —levantarla,
tratarla, verificarla y cerrarla— desde una pantalla, y no solo desde las pruebas.

### Funcionalidades incorporadas en esta línea base

| ID | Funcionalidad | Historia | Estado |
|----|---------------|----------|--------|
| F-01 | Motor de estados con validación por rol | HU-05, HU-06 | Liberada |
| F-02 | Cambio de estado como única vía (`PATCH /api/nc/:id/estado`) | HU-05, HU-06 | Liberada |
| F-03 | Carga de evidencia con hash SHA-256 calculado en el servidor | — (Should have) | Liberada |
| F-04 | Cliente web: login, listado, alta, detalle, sincronización, tablero | HU-01 a HU-07 | Liberada |
| F-05 | Cola offline con `uuid_offline` en el cliente | HU-03 | Liberada |
| F-06 | Tablero de indicadores restringido por rol | HU-07 | Liberada |

### Heredado de LB-H1 (sin cambios)

Autenticación JWT, cuatro roles, modelo de datos y bitácora inmutable por trigger.

### Pruebas

| Tipo | Archivo | Casos | Resultado |
|------|---------|-------|-----------|
| Unitarias | `tests/estados.unit.test.js` | 16 | 16 en verde |
| Integración | `tests/nc.test.js` | 12 | 12 en verde |
| **Total** | | **28** | **28 en verde** |

Cobertura del motor de estados (`src/estados.js`): 100 % de líneas, ramas y funciones.

### Ambientes

| Ambiente | Cómo se levanta | Estado |
|----------|-----------------|--------|
| Desarrollo | `docker compose up` | Operativo |
| Pruebas | `docker compose -f docker-compose.test.yml up` | Operativo, 28/28 |
| Producción | Railway (`Dockerfile` listo, ver instructivo) | Pendiente de despliegue |

### Problemas conocidos y trabajo pendiente

- La app móvil (React Native) no está incluida en esta línea base: se planifica para
  LB-H3, sprint 6. La cola offline ya está probada del lado servidor.
- El despliegue a producción está preparado (Dockerfile y variables de entorno) pero
  no ejecutado. El instructivo de instalación acompaña esta nota.
- Falta la exportación de la NC a PDF, que permanece en el backlog (Won't del MVP).

### Trazabilidad

Cada funcionalidad de la tabla anterior tiene su historia de usuario, su criterio de
aceptación y la prueba que lo verifica. El detalle requisito → código → prueba está en
`TRAZABILIDAD.md`.
