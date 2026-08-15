-- NC-Field · Esquema PostgreSQL
-- La base tiene dos reglas que no dependen del codigo:
--   uuid_offline es UNIQUE para que sincronizar dos veces no duplique
--   historial_estado tiene un trigger que bloquea UPDATE y DELETE

CREATE TABLE IF NOT EXISTS usuario (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(60) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    nombre        VARCHAR(120) NOT NULL,
    rol           VARCHAR(20) NOT NULL CHECK (rol IN ('admin','pem','qaqc','contratista')),
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS no_conformidad (
    id            SERIAL PRIMARY KEY,
    folio         VARCHAR(20) UNIQUE NOT NULL,
    uuid_offline  UUID UNIQUE NOT NULL,
    titulo        VARCHAR(200) NOT NULL,
    descripcion   TEXT NOT NULL,
    tag_equipo    VARCHAR(60),
    severidad     VARCHAR(10) NOT NULL CHECK (severidad IN ('menor','mayor','critica')),
    norma_ref     VARCHAR(120),
    responsable   VARCHAR(120),
    estado        VARCHAR(20) NOT NULL DEFAULT 'abierta'
                  CHECK (estado IN ('abierta','en_tratamiento','verificacion','cerrada','rechazada')),
    creada_por    INTEGER NOT NULL REFERENCES usuario(id),
    creada_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidencia (
    id           SERIAL PRIMARY KEY,
    nc_id        INTEGER NOT NULL REFERENCES no_conformidad(id),
    nombre_arch  VARCHAR(200) NOT NULL,
    sha256       CHAR(64) NOT NULL,                     -- integridad del archivo adjunto
    subida_por   INTEGER NOT NULL REFERENCES usuario(id),
    subida_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historial_estado (
    id           SERIAL PRIMARY KEY,
    nc_id        INTEGER NOT NULL REFERENCES no_conformidad(id),
    estado_desde VARCHAR(20) NOT NULL,
    estado_hasta VARCHAR(20) NOT NULL,
    comentario   TEXT,
    usuario_id   INTEGER NOT NULL REFERENCES usuario(id),
    registrado   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- trigger: nadie edita ni borra la bitacora
CREATE OR REPLACE FUNCTION fn_historial_inmutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'historial_estado es solo-insercion: % no permitido', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_historial_inmutable ON historial_estado;
CREATE TRIGGER trg_historial_inmutable
    BEFORE UPDATE OR DELETE ON historial_estado
    FOR EACH ROW EXECUTE FUNCTION fn_historial_inmutable();
