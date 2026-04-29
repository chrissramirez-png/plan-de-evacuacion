# cf-app-template

Template para crear apps internas de ComunidadFeliz. Next.js + Supabase + Tailwind CSS.

## Como crear tu app

### 1. Crear el repositorio

Haz clic en **"Use this template"** en GitHub para crear un nuevo repo desde este template.

### 2. Configurar con Claude Code

Abre Claude Code en tu nuevo repositorio y dile que app quieres construir. Claude Code se encarga del resto:

```
Abre Claude Code → "Quiero crear una app para [tu idea]"
```

Claude Code va a:

- Instalar dependencias
- Ejecutar el setup con los datos de tu app
- Configurar el proyecto completo

### 3. Configurar Supabase

Necesitas un proyecto en Supabase. Copia `.env.example` a `.env.local` y completa:

| Variable                        | Donde encontrarla                               |
| ------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Settings → API → Project URL         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Settings → API → service_role secret |

### 4. Ejecutar

```bash
npm run dev
```

Abre http://localhost:3000 → login con Google → dashboard.

## Comandos

| Comando            | Descripcion                               |
| ------------------ | ----------------------------------------- |
| `npm run setup`    | Configuracion inicial del proyecto        |
| `npm run validate` | Verifica que no quedan CAMBIAR pendientes |
| `npm run dev`      | Servidor de desarrollo                    |
| `npm run build`    | Build de produccion                       |
| `npm run test`     | Tests (watch mode)                        |
| `npm run test:run` | Tests (single run)                        |

## Stack

- **Next.js 15** (App Router) — frontend + API routes
- **Supabase** — Auth (Google OAuth) + PostgreSQL
- **Tailwind CSS v4** — Design System ComunidadFeliz
- **Railway** — Deploy via Innovation Hub

## Documentacion

Lee `skills/project/READING_ORDER.md` para entender la arquitectura completa.
