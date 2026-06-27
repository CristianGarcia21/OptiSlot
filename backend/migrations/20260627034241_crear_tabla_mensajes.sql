-- Add migration script here
-- migrations/[TIMESTAMP]_crear_tabla_mensajes.sql
CREATE TABLE IF NOT EXISTS mensajes (
    id SERIAL PRIMARY KEY,
    contenido TEXT NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);