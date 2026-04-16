# Checklist de PR — ComunidadFeliz Innovation Hub

Skill que Claude DEBE leer antes de crear o revisar un PR en cualquier repo de la org ComunidadFeliz-Interno.

## 1. Titulo del PR = squash commit message

La org tiene una ruleset que valida el titulo del PR con esta regex:

```
^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)(\(.+\))?: .+
```

### Formato

```
tipo(scope opcional): descripcion en minusculas
```

### Ejemplos correctos

- `feat: agregar login con google`
- `fix(auth): corregir redirect loop en logout`
- `chore: actualizar dependencias`
- `docs(readme): agregar instrucciones de deploy`
- `refactor(api): extraer middleware de autenticacion`

### Ejemplos incorrectos

- `Agregar login con google` — falta el tipo
- `feat:agregar login` — falta espacio despues de `:`
- `feature: agregar login` — `feature` no es un tipo valido
- `feat(auth) corregir bug` — falta `:` despues del scope
- `FEAT: login` — debe ser minusculas

### Tipos validos

| Tipo       | Cuando usarlo                                    |
| ---------- | ------------------------------------------------ |
| `feat`     | Nueva funcionalidad                              |
| `fix`      | Correccion de bug                                |
| `docs`     | Solo cambios en documentacion                    |
| `style`    | Formato, semicolons, espacios (no cambia logica) |
| `refactor` | Reestructurar codigo sin cambiar comportamiento  |
| `test`     | Agregar o corregir tests                         |
| `chore`    | Tareas de mantenimiento, config, deps            |
| `build`    | Cambios en build system o deps externas          |
| `ci`       | Cambios en CI/CD (workflows, pipelines)          |
| `perf`     | Mejoras de rendimiento                           |
| `revert`   | Revertir un commit anterior                      |

## 2. Workflows que deben pasar

### `ci.yml` — Lint, tests, seguridad

Lo que ejecuta (para Node.js):

1. `npm ci` — instalar dependencias
2. `npx eslint . --ext .ts,.tsx,.js,.jsx` — lint
3. `npx vitest run` — tests del proyecto
4. `npx vitest run tests/hub-compliance.test.ts` — tests de compliance del Hub (si existe)
5. `npm audit --audit-level=high` — auditoria de seguridad

### `validate.yml` — Validaciones del Innovation Hub

Seguridad:

- Sin secretos hardcodeados (patrones: `sk_live_`, `sk_test_`, `AKIA...`, private keys, `sb_secret_`, `sbp_`)
- Sin `eval()` / `exec()` en codigo de produccion
- Sin URLs `*.up.railway.app` hardcodeadas
- RLS habilitado en migraciones SQL

Estructura:

- `.gitignore` existe y contiene `.env` y `.env.local`
- `.env` no esta commiteado en git

Skills:

- `skills/baseline/seguridad.md` y `skills/baseline/navegacion.md` existen

hub.config.json:

- Campos obligatorios: `name`, `slug`, `description`, `type`, `visibility`, `owner`
- `type` debe ser: `frontend`, `api`, `slack_bot`, o `cron`
- Endpoints: `health`, `metrics_menu`, `metrics` definidos
- `owner` debe ser un email `@comunidadfeliz.cl`

Skills de proyecto:

- `skills/project/READING_ORDER.md` existe
- `skills/project/01-arquitectura.md` a `04-deploy.md` existen

## 3. Pre-commit hooks locales (Husky + lint-staged)

Estos hooks se ejecutan antes de que el codigo llegue a GitHub:

- **pre-commit**: lint-staged ejecuta `eslint --fix` + `prettier --write` en archivos staged (ts/tsx/js/jsx) y `prettier` en json/md/css
- **commit-msg**: commitlint valida que cada commit siga `@commitlint/config-conventional`

Si un hook falla, corregir antes de commitear. No usar `--no-verify`.

## 4. Copilot code review

La org tiene habilitado Copilot code review automatico en cada push. Genera warnings (no bloquea el merge).

## 5. Verificar localmente antes de pushear

```bash
# Lint
npx eslint . --ext .ts,.tsx,.js,.jsx

# Tests
npx vitest run

# Security
npm audit --audit-level=high

# Build (si aplica)
npm run build

# Verificar hub.config.json manualmente
cat hub.config.json
```

## 6. Errores comunes y como evitarlos

| Error                                      | Causa                                       | Solucion                                                 |
| ------------------------------------------ | ------------------------------------------- | -------------------------------------------------------- |
| CI falla en lint                           | eslint encuentra errores                    | Correr `npx eslint . --fix` y revisar lo que no auto-fix |
| CI falla en tests                          | Tests rotos o faltantes                     | Correr `npx vitest run` local                            |
| CI falla en audit                          | Vulnerabilidad high/critical en dependencia | `npm audit fix` o actualizar la dep manualmente          |
| validate falla en secretos                 | Secreto hardcodeado en el codigo            | Mover a variable de entorno                              |
| validate falla en hub.config.json          | Campo faltante o type invalido              | Completar todos los campos obligatorios                  |
| validate falla en skills                   | Archivos de skills faltantes                | Crear desde template o copiar los archivos base          |
| Commit rechazado por commitlint            | Mensaje no sigue conventional commits       | Reescribir: `git commit --amend -m "tipo: descripcion"`  |
| Squash commit rechazado por ruleset de org | Titulo del PR no sigue el patron            | Editar titulo del PR en GitHub antes de mergear          |

## 7. Reglas del PR

- Requiere PR (no push directo a main)
- 0 aprobaciones requeridas (auto-merge habilitado)
- Squash merge permitido
- La branch se elimina automaticamente despues del merge
