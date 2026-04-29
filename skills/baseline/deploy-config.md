# Configuracion de Deploy — ComunidadFeliz Innovation Hub

Regla obligatoria. Claude Code debe seguirla siempre.

---

## Archivo: hub.config.json

Cada proyecto DEBE tener un archivo `hub.config.json` en la raiz del repositorio. Sin este archivo, el Hub no puede registrar el proyecto.

### Estructura

```json
{
  "name": "Reporting de Ventas",
  "slug": "reporting-ventas",
  "description": "Dashboard de metricas de ventas mensuales",
  "type": "frontend",
  "visibility": "public",
  "owner": "maria@comunidadfeliz.cl",

  "supabase": {
    "schema": "reporting_ventas",
    "rls_enabled": true,
    "migration": "migrations/001_initial.sql"
  },

  "endpoints": {
    "health": "/api/health",
    "metrics_menu": "/api/metrics/menu",
    "metrics": "/api/metrics"
  },

  "env_required": [
    {
      "key": "NEXT_PUBLIC_SUPABASE_URL",
      "description": "URL del proyecto Supabase",
      "public": true
    },
    {
      "key": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "description": "Anon key de Supabase",
      "public": true
    },
    {
      "key": "NEXT_PUBLIC_HUB_URL",
      "description": "URL del Innovation Hub",
      "public": true
    },
    {
      "key": "METRICS_API_KEY",
      "description": "API key para endpoints de metricas",
      "public": false
    }
  ],

  "publicRoutes": ["/pricing", "/about"],

  "sidebar_nav": [
    { "label": "Resumen", "path": "/", "icon": "home" },
    { "label": "Ventas mensuales", "path": "/ventas", "icon": "chart" },
    { "label": "Configuracion", "path": "/config", "icon": "settings" }
  ]
}
```

### Campos obligatorios

- **name**: nombre legible de la app
- **slug**: identificador URL-safe (sin espacios, minusculas, guiones). Define la ruta publica
- **description**: que hace la app en una frase
- **type**: uno de "frontend", "api", "slack_bot", "cron"
- **visibility**: "public" (todos la ven) o "restricted" (solo usuarios con acceso)
- **owner**: email del creador

### Seccion publicRoutes (opcional)

Array de rutas accesibles sin autenticación. Si no se incluye o está vacío, todas las rutas requieren auth.

- Cada entrada es un path (ej: `"/pricing"`, `"/about"`)
- `/login`, `/auth/callback` y `/api/health` son siempre públicas — no declararlas aquí
- Los endpoints API públicos deben usar el prefijo `/api/public/`

### Seccion supabase

- **schema**: nombre del schema aislado que el Hub crea en Supabase para esta app
- **rls_enabled**: DEBE ser true siempre. Si es false, el Hub muestra aviso de seguridad
- **migration**: ruta relativa al archivo SQL de migracion dentro del repo

### Archivo de migracion (migration)

El archivo de migracion es un SQL completo y autocontenido. DEBE:

1. Crear el schema: `CREATE SCHEMA IF NOT EXISTS {schema_name};`
2. Crear todas las tablas dentro del schema
3. Habilitar RLS en todas las tablas
4. Crear las policies de RLS
5. Crear indices necesarios
6. Crear funciones o triggers si los necesita
7. Ser idempotente (usar IF NOT EXISTS en todo)

### Seccion endpoints

Los tres endpoints base son obligatorios. El Hub los usa para health checks y metricas.

### Seccion env_required y env_optional

El Hub usa esta informacion para:

- Configurar automaticamente las variables en Railway al deployar
- Pedir al admin las variables que no puede resolver (campos password, nunca se guardan en la BD)

### Seccion sidebar_nav

Informativa. Define la navegacion interna de la app.

---

## Infraestructura Railway

### Proyecto Railway

Todos los servicios se deployean en el proyecto Railway **"desirable-magic"**. El Hub busca este proyecto por nombre al deployar.

### Variables de entorno automaticas

El Hub configura estas variables automaticamente al deployar:

- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase compartido
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key de Supabase
- `NEXT_PUBLIC_HUB_URL` — URL del Innovation Hub
- `METRICS_API_KEY` — API key para endpoints de metricas
- `DB_SCHEMA` — Nombre del schema aislado (app\_{slug})

### Variables adicionales

Si la app necesita variables extra (ej: API keys de terceros), se declaran en `env_required` o `env_optional` del hub.config.json. El Hub se las pide al admin durante el deploy (campo password, no se guardan).

### NEXT*PUBLIC*\* en Next.js

**CRITICO**: Las variables `NEXT_PUBLIC_*` se embeben en build time, NO en runtime. Si Railway configura las variables despues del primer build, hay que forzar un nuevo build (empty commit + push).

---

## Flujo de registro (solo desde el Hub)

Los servicios SOLO se pueden crear desde el Innovation Hub.

1. El admin va a "Registrar proyecto" en el Hub
2. Pega la URL del repo de GitHub
3. El Hub lee hub.config.json del repo (usa GitHub API con token para repos privados)
4. Muestra la configuracion para revisar
5. Si hay variables extra, las pide al admin (campos password, no se guardan)
6. Click "Deployar en Railway"
7. El Hub:
   a. Verifica que no exista un servicio con el mismo nombre en NINGUN proyecto Railway
   b. Crea el servicio en el proyecto "desirable-magic"
   c. Conecta el repo para continuous deployment (branch main)
   d. Configura variables de entorno
   e. Genera dominio Railway
   f. Registra el proyecto en la BD
   g. Agrega redirect URL a Supabase auth config ({SERVICE_URL}/auth/callback)
8. Si el proyecto tiene `supabase.migration`:
   - El Hub muestra alerta "Schema pendiente" en el dashboard
   - El admin ejecuta el SQL manualmente en Supabase SQL Editor
9. Continuous deployment activado: cada push a main se despliega automaticamente

### Si ya existe un servicio con el mismo nombre

Error 409 con instrucciones para eliminar el servicio conflictivo y reintentar. Los servicios creados fuera del Hub generan inconsistencias en monitoreo y configuracion.

### Al eliminar un proyecto del Hub

Se elimina el servicio de Railway y el registro de la BD. El schema en Supabase NO se elimina (por seguridad).

---

## GitHub

### Organizacion

Todos los repos estan en la org **ComunidadFeliz-Interno** en GitHub.

### Acceso a repos privados

El Hub usa un GitHub Classic PAT con scope `repo` para leer hub.config.json y migration SQL de repos privados. La variable de entorno es `GITHUB_TOKEN`. Los fine-grained tokens NO funcionan con la org.

---

## Para Claude Code

Al crear un proyecto nuevo:

1. **Copiar `skills/project/CLAUDE.md`** a la raiz del proyecto — esto garantiza que cualquier instancia futura de Claude lea las skills
2. Generar hub.config.json con todos los campos
3. Si la app usa base de datos, crear archivo de migracion en `migrations/001_initial.sql`
4. El SQL debe ser completo: schema + tablas + RLS + indices
5. El SQL debe ser idempotente (IF NOT EXISTS)
6. Implementar auth con Supabase usando env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) — NUNCA hardcodear
7. Implementar los tres endpoints obligatorios (/api/health, /api/metrics/menu, /api/metrics)
8. NO crear servicios en Railway — el Hub lo hace
9. Verificar checklist pre-deploy del CLAUDE.md antes de terminar
