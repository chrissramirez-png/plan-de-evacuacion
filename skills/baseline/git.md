# Reglas de Git — ComunidadFeliz Innovation Hub

Estas reglas son obligatorias para todas las apps del Innovation Hub. Claude Code debe seguirlas siempre.

## Estrategia de branching: Trunk-Based Development

- La rama principal es `main`. Siempre debe estar en estado desplegable
- NO se hace push directo a `main`. Todo cambio va por Pull Request
- Las feature branches deben ser cortas (idealmente menos de 2 días de trabajo)
- Nombre de branches: tipo/descripcion-corta. Ejemplos:
  - feat/login-google
  - fix/health-check-timeout
  - docs/actualizar-readme
  - chore/actualizar-dependencias
- NO usar branches de larga duración (no hay develop, staging, ni release branches)
- Si una funcionalidad no está terminada pero necesita estar en main, usar feature flags

## Pull Requests

- Cada PR debe:
  - Tener un título que siga Conventional Commits (feat: agregar login con google)
  - Incluir descripción breve de qué hace y por qué
  - Pasar todos los checks automáticos (lint, tests, security scan) antes de ser revisado
  - Ser revisado y aprobado por al menos 1 gatekeeper antes de mergear
- PRs deben ser pequeños y enfocados. Un PR que cambia 20 archivos es señal de que hay que dividirlo
- Usar "Squash and merge" al mergear para mantener el historial limpio
- Después de mergear, la branch se elimina automáticamente

## Branch protection rules (configurar en GitHub)

- main:
  - Requiere Pull Request antes de mergear
  - Requiere al menos 1 aprobación
  - Requiere que los status checks pasen (lint, tests, security)
  - No permite push directo (ni siquiera admins)
  - Requiere que la branch esté actualizada con main antes de mergear

## Qué NO commitear

- Archivos `.env` con secretos (deben estar en .gitignore)
- `node_modules/`, `__pycache__/`, `.next/`, `dist/` u otros directorios de build
- Archivos de configuración local del editor (excepto .vscode/settings.json si es compartido)
- Archivos grandes binarios (imágenes pesadas, videos, PDFs). Usar almacenamiento externo (Supabase Storage)
- Credenciales, tokens, API keys de ningún tipo

## .gitignore mínimo

Cada proyecto debe incluir al menos:

- .env
- .env.local
- .env.\*.local
- node_modules/
- **pycache**/
- .next/
- dist/
- .DS_Store
- \*.log

## GitHub Actions (CI/CD)

- Cada proyecto debe tener un workflow en `.github/workflows/` que se ejecute en cada push y PR
- El workflow debe incluir como mínimo:
  - Instalar dependencias
  - Correr lint
  - Correr tests
  - Correr scan de seguridad (npm audit o equivalente)
- Si algún paso falla, el PR no se puede mergear
