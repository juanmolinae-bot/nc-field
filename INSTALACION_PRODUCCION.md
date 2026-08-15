# Instructivo de instalación en producción

Cómo desplegar NC-Field en un ambiente de producción. Usa Railway porque es lo
declarado en el plan (AINC421, sección 3.1), pero el `Dockerfile` es estándar y
sirve en cualquier proveedor que corra contenedores.

> **Estado actual:** el proyecto corre en los ambientes de desarrollo y pruebas
> (Docker local). El despliegue a producción está preparado —imagen, variables y
> este instructivo— pero aún no ejecutado. Este documento es el procedimiento para
> hacerlo.

---

## Los tres ambientes

| Ambiente | Dónde corre | Base de datos | Para qué |
|----------|-------------|---------------|----------|
| Desarrollo | Equipo local, `docker compose up` | Con volumen persistente | Programar y probar a mano |
| Pruebas | Local o CI, `docker-compose.test.yml` | En memoria, efímera | Correr las 28 pruebas antes de liberar |
| Producción | Railway | Base gestionada por Railway | Uso real |

La separación es real, no nominal: cada ambiente tiene su propio `JWT_SECRET`, su
propia base y su propia forma de arrancar. El secreto de desarrollo nunca llega a
producción.

---

## Requisitos previos

- Cuenta en Railway (railway.app), plan gratuito basta para el MVP.
- El repositorio en GitHub (ver más abajo cómo subirlo).
- Railway CLI opcional: `npm i -g @railway/cli`.

---

## Paso 1 · Subir el proyecto a GitHub

Si aún no está en GitHub:

```bash
cd nc-field-api
git init
git add .
git commit -m "LB-H2: motor de estados, evidencia y cliente web"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/nc-field.git
git push -u origin main
git tag -a LB-H2-v0.2.0 -m "Linea base Hito 2: 28 pruebas en verde"
git push origin LB-H2-v0.2.0
```

---

## Paso 2 · Crear el proyecto en Railway

1. En railway.app: **New Project → Deploy from GitHub repo → nc-field**.
2. Railway detecta el `Dockerfile` y construye la imagen automáticamente.
3. **New → Database → PostgreSQL**. Railway crea una base gestionada y expone sus
   credenciales como variables.

---

## Paso 3 · Conectar la API con la base

En el servicio de la API, pestaña **Variables**, agrega:

```
PGHOST      = ${{Postgres.PGHOST}}
PGUSER      = ${{Postgres.PGUSER}}
PGPASSWORD  = ${{Postgres.PGPASSWORD}}
PGDATABASE  = ${{Postgres.PGDATABASE}}
PGPORT      = ${{Postgres.PGPORT}}
JWT_SECRET  = <genera uno con: openssl rand -hex 32>
NODE_ENV    = production
```

Las referencias `${{Postgres.*}}` las resuelve Railway solo: la API queda conectada
a la base sin que escribas una contraseña a mano.

---

## Paso 4 · Cargar el esquema la primera vez

El `seed.js` crea las tablas, el trigger y los usuarios. Una sola vez, desde tu equipo
apuntando a la base de Railway:

```bash
# copia la DATABASE_URL pública desde el panel de Railway
PGHOST=<host> PGUSER=<user> PGPASSWORD=<pass> PGDATABASE=<db> PGPORT=<port> node seed.js
```

O con la CLI, sin copiar credenciales: `railway run node seed.js`.

**Antes de presentar en producción real, cambia las contraseñas de los usuarios de
prueba.** Las de `seed.js` son de desarrollo.

---

## Paso 5 · Verificar

```bash
curl https://<tu-app>.up.railway.app/api/salud
# {"estado":"ok","servicio":"nc-field-api"}
```

Después entra por el navegador y haz login con un usuario real.

---

## Cliente web

El cliente (`web/`) se despliega aparte como sitio estático:

```bash
cd web
echo "VITE_API=https://<tu-app>.up.railway.app" > .env.production
npm run build          # genera web/dist
```

Sube `web/dist` a Railway como otro servicio estático, o a Netlify/Vercel. Apunta
`VITE_API` a la URL de la API.

---

## Rollback

Cada línea base es un tag en Git. Para volver a una versión anterior en Railway:
**Deployments → elegir el deploy de la línea base previa → Redeploy**. La base no se
toca; solo vuelve la imagen de la API.
