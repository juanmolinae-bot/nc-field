# NC-Field API — MVP Hito 2

API REST para registrar y hacer seguimiento a no conformidades de
comisionamiento eléctrico. Proyecto de título AINC421, Ingeniería en
Informática, UNAB.

## Stack (el mismo del Informe 1, sección 3.1)
- Node.js + Express (backend / API)
- PostgreSQL 16 (base de datos)
- JWT + Bcrypt (autenticación, 4 roles: admin, pem, qaqc, contratista)
- Jest + Supertest (pruebas)

## Tres decisiones de diseño y por qué las tomé
1. **`uuid_offline` UNIQUE en la base.** El teléfono genera el UUID en terreno,
   sin señal. Cuando vuelve la conexión y sincroniza dos veces, la base
   reconoce el UUID y devuelve la misma NC con el mismo folio. La puse en la
   base y no en el código porque puede haber más de un cliente sincronizando a
   la vez, y ahí una validación en la aplicación se queda corta.
2. **Bitácora de solo inserción, por trigger.** `historial_estado` no acepta
   UPDATE ni DELETE, y el bloqueo está en PostgreSQL, no en la aplicación. Una
   bitácora que respalda una discusión de contrato no se edita: ni siquiera yo
   puedo tocarla desde `psql`.
3. **No hay DELETE de una NC.** Una NC se cierra o se rechaza, pero no se borra.
   Es algo que saqué a propósito respecto de mi prototipo anterior (GestorComm).

## Instalación
```bash
# 1. PostgreSQL
sudo apt install postgresql
sudo -u postgres psql -c "CREATE USER ncfield WITH PASSWORD 'ncfield_dev';"
sudo -u postgres createdb -O ncfield ncfield_db

# 2. Dependencias y esquema
npm install
node seed.js          # carga esquema + usuarios de prueba

# 3. Correr
node server.js        # API en http://localhost:3000

# 4. Pruebas
npx jest --runInBand
```

## Usuarios de prueba
| usuario | clave | rol |
|---|---|---|
| jmolina | admin1234 | admin |
| pem1 | pem1234 | pem |
| qaqc1 | qaqc1234 | qaqc |
| contra1 | contratista1234 | contratista |

## Endpoints
- `POST /api/auth/login` — devuelve JWT
- `POST /api/nc` — crea/sincroniza NC (idempotente por uuid_offline)
- `GET /api/nc` — listado
- `GET /api/nc/dashboard` — KPIs (solo pem/qaqc/admin → contratista recibe 403)
- `PATCH /api/nc/:id/estado` — única vía de cambio de estado (motor de transiciones)
- `GET /api/nc/:id/historial` — bitácora inmutable

---

## Cliente web (Hito 2)

Reproduce los mockups M1 a M6, conectado a la API real.

```bash
cd web
npm install
npm run dev        # http://localhost:5173  (la API debe estar corriendo en :3000)
```

### Cómo se corresponde con los mockups

| Mockup | Pantalla | Historia |
|---|---|---|
| M1 | `src/screens/Login.jsx` | HU-01 · autenticación JWT |
| M2 | `src/screens/Listado.jsx` | HU-04 · consulta y filtro |
| M3 | `src/screens/NuevaNC.jsx` | HU-02 · levantar NC en terreno |
| M4 | `src/screens/Detalle.jsx` | HU-05, HU-06, HU-08 · trazabilidad |
| M5 | `src/screens/Sync.jsx` | HU-03 · sincronización idempotente |
| M6 | `src/screens/Tablero.jsx` | HU-07 · indicadores de gestión |

Los colores y tipografía salen de `tailwind.config.js`, con los tokens exactos
de los mockups. La tipografía es Carlito (métricamente idéntica a Calibri).

### La cola offline

`src/api.js` genera el `uuid_offline` **en el equipo**, con `crypto.randomUUID()`,
en el momento en que se levanta la NC — igual que hará la app móvil. La cola vive
en `localStorage`; en React Native vivirá en SQLite. El resto de la lógica es la
misma, y por eso reenviar la cola es seguro: el servidor reconoce el uuid y
devuelve la NC original en vez de duplicarla.

Para probarlo: levanta una NC con la API apagada, préndela y sincroniza.
Después toca "Sincronizar ahora" otra vez: la NC vuelve marcada como duplicada,
con el mismo folio.

### Verificación de la interfaz

```bash
node qa/verificar.js    # 30 comprobaciones sobre la UI ya renderizada
node qa/recorrer.js     # captura las 11 pantallas en qa/*.png
```

Requieren la API en `:3000` y Vite en `:5173`. Usan `puppeteer-core`; si no
tienes Chrome, ajusta la constante `CHROME` al binario de tu equipo
(`which chromium` en Linux Mint).
