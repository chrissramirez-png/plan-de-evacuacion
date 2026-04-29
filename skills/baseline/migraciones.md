# Reglas de Migraciones SQL — ComunidadFeliz Innovation Hub

Estas reglas son obligatorias para todas las apps del Innovation Hub. Claude Code debe seguirlas siempre.

---

## Principio fundamental

El archivo de migracion SQL (`migrations/001_initial.sql`) es la **unica fuente de verdad** del schema de base de datos. El Innovation Hub lee este archivo directamente del repo para ejecutar las migraciones en Supabase. Si el archivo no refleja el estado actual del schema, la app no funciona.

**Restriccion critica**: Cada app solo puede crear objetos dentro de su propio schema (el slug de la app). Crear tablas, policies o cualquier objeto en el schema `public` esta **prohibido** y la migracion sera rechazada. El schema `public` es gestionado exclusivamente por el Hub.

---

## Regla: migracion siempre completa y actualizada

Cada vez que se modifique el schema de la base de datos (agregar tabla, agregar columna, cambiar tipo, agregar index, agregar policy RLS), el archivo de migracion DEBE actualizarse para reflejar el estado completo y actual.

### Que debe contener el archivo de migracion

1. `CREATE SCHEMA IF NOT EXISTS {slug}` — creacion del schema de la app
2. `GRANT USAGE ON SCHEMA {slug} TO anon, authenticated, service_role` — exponer schema
3. `ALTER DEFAULT PRIVILEGES IN SCHEMA {slug} GRANT ALL ON TABLES TO anon, authenticated, service_role` — defaults
4. `CREATE TABLE IF NOT EXISTS {slug}.tabla` — para CADA tabla que la app usa (siempre dentro del schema de la app)
5. `ALTER TABLE {slug}.tabla ENABLE ROW LEVEL SECURITY` — para CADA tabla
6. `CREATE POLICY` — policies RLS para CADA tabla
7. `CREATE INDEX IF NOT EXISTS` — indices necesarios
8. `GRANT SELECT/INSERT/UPDATE/DELETE ON {slug}.tabla TO authenticated` — permisos por tabla

### Formato obligatorio

- Usar `IF NOT EXISTS` en todos los CREATE para que la migracion sea **idempotente** (se puede ejecutar multiples veces sin error)
- Usar `DROP POLICY IF EXISTS` antes de `CREATE POLICY` para que las policies se puedan re-ejecutar
- Agrupar por tabla: primero CREATE TABLE, luego RLS, luego policies, luego grants
- Comentar cada seccion

---

## Cuando actualizar la migracion

| Accion en el codigo                          | Actualizacion requerida en migracion                    |
| -------------------------------------------- | ------------------------------------------------------- |
| Nuevo `.from("tabla")` en el codigo          | Agregar `CREATE TABLE IF NOT EXISTS` + RLS + policies   |
| Nuevo campo en `.select("..., nuevo_campo")` | Agregar columna al `CREATE TABLE`                       |
| Nuevo `.insert()` o `.update()`              | Verificar que la policy permite la operacion            |
| Borrar tabla del codigo                      | Comentar o eliminar del SQL (no dejar tablas huerfanas) |
| Cambiar tipo de columna                      | Actualizar en el `CREATE TABLE`                         |

---

## Deteccion automatica

El CI verifica que cada tabla referenciada en el codigo con `.from("tabla")` (Next.js) o `table("tabla")` (Python) tenga su correspondiente `CREATE TABLE` en el archivo de migracion. Si falta, el CI falla.

---

## Ejemplo completo

```sql
-- Migracion inicial — Mi App
-- Idempotente: se puede ejecutar multiples veces sin error
-- IMPORTANTE: Solo crear objetos dentro del schema de la app. NUNCA en public.

-- Schema
CREATE SCHEMA IF NOT EXISTS mi_app;

-- Exponer schema a todos los roles de Supabase
GRANT USAGE ON SCHEMA mi_app TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA mi_app
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Tabla: tareas
CREATE TABLE IF NOT EXISTS mi_app.tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  completada boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mi_app.tareas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tareas_select" ON mi_app.tareas;
CREATE POLICY "tareas_select" ON mi_app.tareas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tareas_insert" ON mi_app.tareas;
CREATE POLICY "tareas_insert" ON mi_app.tareas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON mi_app.tareas TO authenticated;
```

---

## Acceso a schemas no-public desde el codigo

Para consultar tablas fuera del schema `public`, usar `.schema()` en el cliente de Supabase:

```typescript
const { data } = await supabase.schema("mi_app").from("tareas").select("*");
```

Esto es obligatorio para todas las tablas de la app, ya que estan en el schema propio y no en `public`.

---

## Patrones de acceso segun tipo de datos

No todas las tablas necesitan restriccion por usuario. Elegir el patron segun el tipo de datos:

### 1. Lectura publica, escritura autenticada

Contenido visible para todos (FAQ, catalogo, config publica), pero solo usuarios logueados pueden crear/editar.

```sql
-- Cualquiera puede leer
DROP POLICY IF EXISTS "faq_select" ON mi_app.faq;
CREATE POLICY "faq_select" ON mi_app.faq
  FOR SELECT USING (true);

-- Solo autenticados pueden insertar
DROP POLICY IF EXISTS "faq_insert" ON mi_app.faq;
CREATE POLICY "faq_insert" ON mi_app.faq
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT ON mi_app.faq TO anon;
GRANT SELECT, INSERT, UPDATE ON mi_app.faq TO authenticated;
```

### 2. Lectura y escritura publica

Formularios anonimos, feedback, encuestas sin login.

```sql
DROP POLICY IF EXISTS "feedback_select" ON mi_app.feedback;
CREATE POLICY "feedback_select" ON mi_app.feedback
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "feedback_insert" ON mi_app.feedback;
CREATE POLICY "feedback_insert" ON mi_app.feedback
  FOR INSERT WITH CHECK (true);

GRANT SELECT, INSERT ON mi_app.feedback TO anon;
```

### 3. Tabla mixta con campo is_public

Parte del contenido es publico, parte es privado. Usar un campo booleano para controlar.

```sql
DROP POLICY IF EXISTS "docs_select_public" ON mi_app.documentos;
CREATE POLICY "docs_select_public" ON mi_app.documentos
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "docs_select_owner" ON mi_app.documentos;
CREATE POLICY "docs_select_owner" ON mi_app.documentos
  FOR SELECT USING (auth.uid() = owner_id);

GRANT SELECT ON mi_app.documentos TO anon;
GRANT ALL ON mi_app.documentos TO authenticated;
```

### 4. Tabla privada (solo el dueno)

Datos personales, configuracion de usuario. Solo el dueno puede leer y escribir.

```sql
DROP POLICY IF EXISTS "tareas_select" ON mi_app.tareas;
CREATE POLICY "tareas_select" ON mi_app.tareas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tareas_insert" ON mi_app.tareas;
CREATE POLICY "tareas_insert" ON mi_app.tareas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON mi_app.tareas TO authenticated;
```

---

## Lo que NUNCA hacer

- Crear tablas, policies o cualquier objeto en el schema `public` (sera rechazado)
- Dejar el archivo de migracion con el template de ejemplo mientras el codigo ya usa tablas reales
- Agregar tablas al codigo sin agregarlas a la migracion
- Crear tablas sin RLS
- Usar `USING (true)` en tablas con datos de usuarios — ver patrones de acceso arriba
- Modificar schemas de otras apps
