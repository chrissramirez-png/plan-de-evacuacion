# Prompt para Apps del Innovation Hub — ComunidadFeliz

---

## Prompt para proyectos nuevos

```
Este proyecto es una app interna de ComunidadFeliz para el Innovation Hub.

PASO 1: Lee TODOS estos archivos AHORA, antes de escribir cualquier código:

- skills/project/01-arquitectura.md
- skills/project/02-endpoints.md
- skills/project/03-seguridad-app.md
- skills/project/04-deploy.md
- skills/baseline/deploy-config.md
- skills/baseline/seguridad.md
- skills/baseline/design-system-cf.md
- skills/baseline/proceso-de-desarrollo.md

PASO 2: Verifica que CLAUDE.md existe en la raíz del proyecto.
Ya viene incluido en el template. Si no existe, hay un problema
con la copia del template.

PASO 3: Confirma que leíste todo y lista los puntos clave que vas a seguir.

[AQUÍ DESCRIBE TU APP: qué hace, para quién, qué problema resuelve]
```

---

## Prompt para proyectos existentes

```
Este proyecto ya existe y necesita integrarse con el Innovation Hub.

PASO 1: Lee TODOS estos archivos AHORA:

- skills/project/01-arquitectura.md
- skills/project/02-endpoints.md
- skills/project/03-seguridad-app.md
- skills/project/04-deploy.md

PASO 2: Verifica que existe CLAUDE.md en la raíz. Si no existe,
hay un problema con la copia del template.

PASO 3: Analiza el proyecto y muéstrame un diagnóstico:
- ¿Tiene hub.config.json?
- ¿Tiene /api/health, /api/metrics/menu, /api/metrics?
- ¿Tiene auth con Supabase Google OAuth usando env vars (NO hardcodeadas)?
- ¿Tiene el header estándar CF? (56px, logo CF + link al Hub, nombre app, usuario, salir)
- ¿Retorna JSON en errores o HTML?
- ¿Tiene RLS en las tablas?
- ¿Las variables de Supabase vienen de NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY?

NO hagas cambios hasta que yo apruebe el diagnóstico.
```

---

## Por qué CLAUDE.md es obligatorio

El CLAUDE.md en la raíz del proyecto se carga automáticamente al inicio de
cada conversación de Claude Code. Sin él, Claude no tiene contexto sobre
las skills y puede implementar auth incorrecto, usar colores equivocados,
o saltarse endpoints obligatorios.

El CLAUDE.md incluye:

- Instrucción imperativa de leer TODAS las skills con Read antes de escribir código
- Reglas clave del proyecto (auth, env vars, endpoints, design system)
- Checklist de verificación pre-deploy

---

## Estructura de skills/

```
skills/
  baseline/          ← Reglas generales (iguales en todos los proyectos)
    seguridad.md
    design-system-cf.md
    testing-y-codigo.md
    git.md
    metricas.md
    proceso-de-desarrollo.md
    navegacion.md
    deploy-config.md
    stack-aprobado.md
    assets/
      cf-logo-name.svg
      cf-logo-square.webp

  project/           ← Reglas para apps conectadas al Hub
    READING_ORDER.md
    01-arquitectura.md
    02-endpoints.md
    03-seguridad-app.md
    04-deploy.md
    prompt-template.md
```

Cada app implementa su propio auth con Supabase Google OAuth. Ver 03-seguridad-app.md.
