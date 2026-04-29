# Orden de lectura — Apps del Innovation Hub

**IMPORTANTE:** Estas skills son para proyectos que se conectan al Innovation Hub. Si estás trabajando en el repo del Hub (`cf-innovation-hub`), estas skills NO aplican.

Lee estos archivos EN ORDEN antes de escribir código.

## Obligatorios (leer siempre)

1. **01-arquitectura.md** — Cómo funciona, reglas críticas, auth, header estándar. LEER PRIMERO.
2. **02-endpoints.md** — Health, metrics, manejo de errores en API y frontend.
3. **03-seguridad-app.md** — Auth con Supabase, cookies compartidas, verificación de acceso.
4. **04-deploy.md** — Variables de entorno, Docker, credenciales, registro en el Hub.

## Complementarios (leer según necesidad)

5. **stack-aprobado.md** (baseline) — Servicios permitidos y bloqueados. LEER ANTES DE AGREGAR DEPENDENCIAS.
6. **deploy-config.md** (baseline) — Especificación completa de hub.config.json.
7. **metricas.md** (baseline) — Lista completa de métricas obligatorias y opcionales por tipo.
8. **design-system-cf.md** (baseline) — Colores, tipografía, componentes UI.
9. **seguridad.md** (baseline) — Secretos, RLS, sanitización de datos.
10. **testing-y-codigo.md** (baseline) — TDD, Vitest, ESLint, Husky.
11. **git.md** (baseline) — Conventional Commits, branches, CI/CD.

## Si es un proyecto nuevo desde cero

11. **proceso-de-desarrollo.md** (baseline) — Spec-Driven Development (specify → plan → tasks → implement).

## Notas

- Cada app implementa su propio auth (Supabase Google OAuth). Las cookies NO se comparten entre apps (dominios distintos en Railway). El usuario hace login en cada app por separado.
- El flujo de auth esta en 01-arquitectura.md y 03-seguridad-app.md.
- El Hub tiene sus propias skills en `skills/hub/`. No mezclar.
- El Hub agrega automaticamente la URL de callback de cada app a Supabase al deployar.
