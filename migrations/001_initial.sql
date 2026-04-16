-- Migración inicial (CAMBIAR según tu app)
-- CAMBIAR: reemplazar "CAMBIAR_app_slug" por el slug de tu app (definido en hub.config.json)
-- Este archivo se ejecuta automaticamente por el Hub en Supabase
--
-- IMPORTANTE: Solo puedes crear objetos dentro del schema de tu app.
-- NO crear tablas, policies ni grants en el schema "public".
-- El schema "public" es gestionado por el Hub y compartido entre todas las apps.

-- 1. Schema de la app
CREATE SCHEMA IF NOT EXISTS CAMBIAR_app_slug;

-- 2. Exponer schema a los roles de Supabase (obligatorio para que la API funcione)
GRANT USAGE ON SCHEMA CAMBIAR_app_slug TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA CAMBIAR_app_slug
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- 3. Tablas (CAMBIAR según tu app):
-- CREATE TABLE IF NOT EXISTS CAMBIAR_app_slug.datos (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   valor text NOT NULL,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );

-- 4. RLS (habilitar en TODAS las tablas):
-- ALTER TABLE CAMBIAR_app_slug.datos ENABLE ROW LEVEL SECURITY;

-- 5. Policies (definir quién puede leer/escribir):
-- DROP POLICY IF EXISTS "datos_select" ON CAMBIAR_app_slug.datos;
-- CREATE POLICY "datos_select" ON CAMBIAR_app_slug.datos FOR SELECT USING (true);

-- 6. Grants por tabla:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON CAMBIAR_app_slug.datos TO authenticated;

-- 7. Storage (opcional — si tu app necesita subir archivos):
-- Crear buckets con el prefijo del slug de tu app para evitar colisiones.
-- Ejemplo: bucket para fotos y otro para documentos.
--
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('CAMBIAR_app_slug-fotos', 'CAMBIAR_app_slug-fotos', true)
--   ON CONFLICT DO NOTHING;
--
-- Policies de Storage (definir quien puede subir/leer):
-- DROP POLICY IF EXISTS "upload_fotos" ON storage.objects;
-- CREATE POLICY "upload_fotos" ON storage.objects
--   FOR INSERT TO authenticated WITH CHECK (bucket_id = 'CAMBIAR_app_slug-fotos');
-- DROP POLICY IF EXISTS "read_fotos" ON storage.objects;
-- CREATE POLICY "read_fotos" ON storage.objects
--   FOR SELECT TO authenticated USING (bucket_id = 'CAMBIAR_app_slug-fotos');
--
-- NOTA: Usa "authenticated" para que solo usuarios logueados puedan subir.
-- Usa "anon" solo si la app tiene formularios publicos sin login.
