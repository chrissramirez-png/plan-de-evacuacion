# CLAUDE.md — cf-app-template

## Primera vez (proyecto recien creado desde template)

Si `hub.config.json` contiene "CAMBIAR", este proyecto no ha sido configurado.
Ejecuta el setup ANTES de cualquier otra cosa:

```bash
npm install
npm run setup -- --name "..." --description "..." --owner "..." --capabilities "..." [--area "..."]
```

Pide al usuario los datos que necesitas para completar el comando.

Despues del setup, el siguiente paso es configurar `.env.local` con credenciales de Supabase.

## Lectura obligatoria

Antes de escribir cualquier codigo, lee en este orden:

1. `skills/project/READING_ORDER.md`
2. `skills/project/01-arquitectura.md`
3. `skills/project/02-endpoints.md`
4. `skills/project/03-seguridad-app.md`
5. `skills/project/04-deploy.md`

Para contexto adicional, lee los skills en `skills/baseline/`.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: Supabase Google OAuth (@supabase/ssr + @supabase/supabase-js)
- **UI**: Tailwind CSS v4 + Design System ComunidadFeliz
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint + Prettier + commitlint
- **Deploy**: Railway (via Innovation Hub)

## Reglas del proyecto

1. **Auth**: Supabase Google OAuth, solo cuentas @comunidadfeliz.cl para rutas internas. Si `publicAuth` esta habilitado, usuarios externos pueden autenticarse via `/public/login` y acceder a rutas `/public/*`. Auth ya implementado — no modificar `lib/supabase/`, `lib/auth.ts`, `middleware.ts` sin razon.
2. **API routes**: Siempre retornan JSON. `/api/health` publico. `/api/metrics/*` protegidos con `x-api-key`. `/api/public/*` son endpoints publicos (sin auth).
3. **Vistas publicas**: Paginas en `app/(public)/` son accesibles sin login. Configurar `publicRoutes` en `hub.config.json` y `PUBLIC_ROUTES` en `middleware.ts`. NUNCA exponer datos sensibles en rutas publicas.
4. **Design system**: Usar los componentes de `components/ui/`. Colores CF definidos en `globals.css`. Font: Montserrat.
5. **Header 56px**: Ya implementado en `components/layout/Header.tsx`. No duplicar, no modificar estructura.
6. **Sidebar**: Editar links en `components/layout/Sidebar.tsx`.
7. **Environment**: Las vars `NEXT_PUBLIC_*` se embeben en build-time. Nunca hardcodear secrets.
8. **Database**: PostgreSQL via Supabase. RLS obligatorio en todas las tablas. Todas las tablas van en el schema propio de la app (el slug), **NUNCA en `public`**. Usar `.schema("slug")` en el cliente de Supabase para consultar tablas. La migracion debe exponer el schema con grants para `anon`, `authenticated` y `service_role`.
9. **Admin**: El owner definido en `hub.config.json` es automaticamente admin. No hardcodear emails de admin.
10. **Migraciones**: El archivo SQL en `migrations/` declarado en `hub.config.json` campo `supabase.migration` es el que el Hub ejecuta al deployar. SIEMPRE mantenerlo actualizado con TODOS los cambios de schema. El Hub lee este archivo directamente del repo para ejecutar las migraciones. RLS es obligatorio en cada tabla.

## Capabilities

El proyecto declara sus capabilities en `hub.config.json`. Cada capability agrega archivos y validaciones:

- **frontend**: Login, dashboard, auth callback, UI components
- **api**: Endpoints health/metrics, documentacion publica
- **cron**: Registry en `lib/cron.ts`, endpoints `/api/cron` y `/api/cron/[name]`, documentacion publica
- **slack_bot**: Framework en `lib/slack/`, endpoints `/api/slack/*`, documentacion publica
- **public_auth**: Login publico para usuarios externos (no @comunidadfeliz.cl) via Google OAuth. Rutas internas siguen restringidas.

Un proyecto puede tener multiples capabilities (ej: `["frontend", "api", "cron"]`).
Proyectos sin frontend requieren pagina de documentacion publica en `app/(public)/docs/`.

### public_auth (autenticacion publica)

Permite que usuarios externos (no @comunidadfeliz.cl) se autentiquen via Google OAuth y accedan a rutas bajo `/public/`.

**Archivos:**

- `app/(public)/public/login/page.tsx` — Pagina de login publico (sin verificacion de dominio)
- `app/(public)/public/dashboard/page.tsx` — Dashboard de ejemplo para usuarios externos
- `lib/auth-public.ts` — Utilidades: `isInternalUser()`, `getPublicRedirect()`
- `app/auth/callback/page.tsx` — Modificado para manejar ambos flujos (interno y publico)

**Configuracion:**

- `hub.config.json` → `"publicAuth": true` para habilitar
- El callback detecta el flujo via query param `?flow=public` o `sessionStorage`
- Usuarios internos siempre van a `/dashboard`, externos a `/public/dashboard`
- Usuarios externos que intenten login interno son rechazados con error

**Reglas:**

- Rutas internas (`/dashboard/*`) requieren @comunidadfeliz.cl
- Rutas publicas (`/public/*`) permiten cualquier cuenta de Google
- No exponer datos sensibles en rutas publicas

## Scripts

| Comando            | Descripcion                               |
| ------------------ | ----------------------------------------- |
| `npm run setup`    | Configuracion inicial del proyecto        |
| `npm run validate` | Verifica que no quedan CAMBIAR pendientes |
| `npm run dev`      | Servidor de desarrollo                    |
| `npm run build`    | Build de produccion                       |
| `npm run lint`     | ESLint                                    |
| `npm run test`     | Vitest (watch mode)                       |
| `npm run test:run` | Vitest (single run)                       |

## Estructura

```
scripts/
  setup.ts              # Configuracion inicial (CLI + interactivo)
  validate.ts           # Validacion de CAMBIAR pendientes
app/
  layout.tsx            # Root layout (Montserrat, metadata)
  globals.css           # Tailwind v4 + CF design tokens
  page.tsx              # Redirect segun capabilities
  login/page.tsx        # Google OAuth login
  auth/                 # Callback + confirm
  dashboard/
    layout.tsx          # Auth guard + AppLayout
    page.tsx            # Pagina principal
  (public)/
    layout.tsx          # Layout publico (Header adaptativo)
    public/page.tsx     # Pagina publica de ejemplo
    public/login/       # Login publico (cualquier Google, sin dominio)
    public/dashboard/   # Dashboard para usuarios externos
    docs/page.tsx       # Documentacion (obligatorio sin frontend)
  api/
    health/             # GET /api/health (publico)
    metrics/            # GET /api/metrics (x-api-key)
    metrics/menu/       # GET /api/metrics/menu (x-api-key)
    auth/profile/       # POST profile upsert
    public/example/     # GET /api/public/example (sin auth)
    cron/               # GET /api/cron (lista crons, x-api-key)
    cron/[name]/        # GET /api/cron/:name (ejecuta cron, x-api-key)
    slack/commands/     # POST slash commands (Slack signing)
    slack/events/       # POST Events API (Slack signing)
    slack/interactions/ # POST botones/modals (Slack signing)
    webhook/example/    # POST webhook generico
components/
  layout/               # Header, Sidebar, AppLayout, PublicLayout, ThemeProvider
  ui/                   # Button, Card, Input, Modal, Table, etc.
lib/
  supabase/             # Client, server, middleware
  auth.ts               # Domain verify, roles (lee owner de hub.config.json)
  auth-public.ts        # isInternalUser(), getPublicRedirect()
  auth-api.ts           # Token verify para API routes
  api-client.ts         # authFetch wrapper
  types.ts              # Profile, UserRole
  cron.ts               # Cron registry (registerCron, listCrons)
  slack/                # Slack bot framework
    verify.ts           # Request signature verification
    client.ts           # Web API client (sendMessage, etc.)
    commands.ts         # Slash command registry
    events.ts           # Event handler registry
    blocks.ts           # Block Kit message builder
```

## Verificacion pre-deploy

- [ ] `npm run validate` pasa (0 CAMBIAR pendientes)
- [ ] `npm run build` sin errores
- [ ] `npx vitest run` pasa
- [ ] `npx eslint .` sin errores
- [ ] `.env.local` configurado con Supabase real
- [ ] `hub.config.json` completo
- [ ] Migrations con RLS habilitado
