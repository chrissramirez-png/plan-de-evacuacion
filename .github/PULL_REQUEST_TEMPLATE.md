## Que hace este PR

<!-- Descripcion breve del cambio y por que se hace -->

## Checklist

### Titulo del PR (squash commit)

- [ ] Sigue Conventional Commits: `tipo(scope): descripcion`
  - Tipos validos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `revert`
  - Regex que debe pasar: `^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)(\(.+\))?: .+`

### CI (`ci.yml`)

- [ ] Lint pasa sin errores (`npx eslint .`)
- [ ] Tests pasan (`npx vitest run`)
- [ ] Security audit pasa (`npm audit --audit-level=high`)

### Validacion (`validate.yml`)

- [ ] No hay secretos hardcodeados en el codigo
- [ ] No hay `eval()` / `exec()` en codigo de produccion
- [ ] No hay URLs de Railway hardcodeadas
- [ ] `.gitignore` incluye `.env` y `.env.local`
- [ ] `hub.config.json` tiene todos los campos obligatorios (name, slug, description, type, visibility, owner, endpoints)
- [ ] Owner es un email `@comunidadfeliz.cl`
- [ ] Los archivos de skills requeridos existen (`skills/baseline/`, `skills/project/01-04`)

## Test plan

<!-- Como verificar que el cambio funciona -->
