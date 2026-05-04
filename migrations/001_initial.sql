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

-- 3. Tablas
CREATE TABLE IF NOT EXISTS plan_evacuacion.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS (habilitar en TODAS las tablas)
ALTER TABLE plan_evacuacion.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "profiles_select" ON plan_evacuacion.profiles;
CREATE POLICY "profiles_select" ON plan_evacuacion.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert" ON plan_evacuacion.profiles;
CREATE POLICY "profiles_insert" ON plan_evacuacion.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON plan_evacuacion.profiles;
CREATE POLICY "profiles_update" ON plan_evacuacion.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. Grants por tabla
GRANT SELECT, INSERT, UPDATE ON plan_evacuacion.profiles TO authenticated;

-- ── Plans table ─────────────────────────────────────────────────
-- Almacena planes de evacuación publicados, accesibles por código único.
CREATE TABLE IF NOT EXISTS plan_evacuacion.plans (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text        UNIQUE NOT NULL,
  name       text        NOT NULL DEFAULT 'Plan de Evacuación',
  data       jsonb       NOT NULL,
  created_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plan_evacuacion.plans ENABLE ROW LEVEL SECURITY;

-- Cualquier rol puede leer un plan por código (residentes via link)
DROP POLICY IF EXISTS "plans_select" ON plan_evacuacion.plans;
CREATE POLICY "plans_select" ON plan_evacuacion.plans FOR SELECT USING (true);

-- Solo usuarios autenticados pueden crear/actualizar planes
DROP POLICY IF EXISTS "plans_insert" ON plan_evacuacion.plans;
CREATE POLICY "plans_insert" ON plan_evacuacion.plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "plans_update" ON plan_evacuacion.plans;
CREATE POLICY "plans_update" ON plan_evacuacion.plans FOR UPDATE
  USING (created_by = auth.uid() OR auth.uid() IS NOT NULL);

GRANT SELECT ON plan_evacuacion.plans TO anon;
GRANT SELECT, INSERT, UPDATE ON plan_evacuacion.plans TO authenticated, service_role;

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
