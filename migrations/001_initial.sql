-- Migración inicial — Plan de Evacuación Interactivo
-- Schema: plan_evacuacion
-- Este archivo se ejecuta automaticamente por el Hub en Supabase
--
-- IMPORTANTE: Solo puedes crear objetos dentro del schema de tu app.
-- NO crear tablas, policies ni grants en el schema "public".
-- El schema "public" es gestionado por el Hub y compartido entre todas las apps.

-- 1. Schema de la app
CREATE SCHEMA IF NOT EXISTS plan_evacuacion;

-- 2. Exponer schema a los roles de Supabase (obligatorio para que la API funcione)
GRANT USAGE ON SCHEMA plan_evacuacion TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA plan_evacuacion
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- 3. Tablas (agregar según necesidad):
-- CREATE TABLE IF NOT EXISTS plan_evacuacion.datos (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   valor text NOT NULL,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );

-- 4. RLS (habilitar en TODAS las tablas):
-- ALTER TABLE plan_evacuacion.datos ENABLE ROW LEVEL SECURITY;

-- 5. Policies (definir quién puede leer/escribir):
-- DROP POLICY IF EXISTS "datos_select" ON plan_evacuacion.datos;
-- CREATE POLICY "datos_select" ON plan_evacuacion.datos FOR SELECT USING (true);

-- 6. Grants por tabla:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON plan_evacuacion.datos TO authenticated;

-- 7. Storage (opcional — si tu app necesita subir archivos):
-- Crear buckets con el prefijo del slug de tu app para evitar colisiones.
-- Ejemplo: bucket para fotos y otro para documentos.
--
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('plan_evacuacion-fotos', 'plan_evacuacion-fotos', true)
--   ON CONFLICT DO NOTHING;
--
-- Policies de Storage (definir quien puede subir/leer):
-- DROP POLICY IF EXISTS "upload_fotos" ON storage.objects;
-- CREATE POLICY "upload_fotos" ON storage.objects
--   FOR INSERT TO authenticated WITH CHECK (bucket_id = 'plan_evacuacion-fotos');
-- DROP POLICY IF EXISTS "read_fotos" ON storage.objects;
-- CREATE POLICY "read_fotos" ON storage.objects
--   FOR SELECT TO authenticated USING (bucket_id = 'plan_evacuacion-fotos');
--
-- NOTA: Usa "authenticated" para que solo usuarios logueados puedan subir.
-- Usa "anon" solo si la app tiene formularios publicos sin login.
