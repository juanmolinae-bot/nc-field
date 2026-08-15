# Imagen de la API NC-Field. Multi-stage: dependencias primero, luego el código.
FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY server.js seed.js ./
# Usuario sin privilegios: el contenedor no corre como root.
RUN useradd --system --uid 1001 ncfield && chown -R ncfield /app
USER ncfield
EXPOSE 3000
CMD ["node", "server.js"]
