# Proceso de Desarrollo — ComunidadFeliz Innovation Hub

Esta regla es obligatoria. Claude Code debe seguirla SIEMPRE.

## Antes de empezar: identificar el escenario

Antes de escribir cualquier código, determinar si se trata de un proyecto nuevo o un proyecto existente.

### Escenario A: Proyecto nuevo (no hay código aún)

Seguir el flujo completo de Spec-Driven Development (ver sección siguiente).

### Escenario B: Proyecto existente (ya hay codigo)

NO obligar a pasar por el flujo de Spec-Driven Development. En su lugar, hacer un **audit completo** del proyecto antes de cualquier cambio.

#### Audit obligatorio (ANTES de escribir cualquier codigo)

Leer TODO el proyecto y generar un reporte con:

**1. Estado actual del proyecto:**

- Stack (lenguaje, framework, dependencias)
- Estructura de carpetas
- Como maneja auth (tiene login? callback? auth.js? middleware?)
- Endpoints existentes (health, metrics, API propias)
- Base de datos (tiene schema? RLS? migration?)
- Deploy (tiene next.config.ts? que variables de entorno usa?)
- Variables de entorno (cuales usa? cuales faltan?)

**2. Que se apega a las skills:**

- Tiene hub.config.json? esta completo?
- Implementa los 3 endpoints obligatorios? (/api/health, /api/metrics/menu, /api/metrics)
- Auth con Supabase Google OAuth? skipBrowserRedirect? variable `sb` (no `supabase`)?
- Header CF 56px?
- RLS en todas las tablas?
- Dockerfile copia TODOS los archivos necesarios (login.html, auth-callback.html, etc)?
- Headers de seguridad?
- Error handlers que retornan JSON (no HTML)?

**3. Que sobra o hay que eliminar:**

- Codigo muerto (rutas no usadas, archivos obsoletos, imports sin usar)
- Vestigios de arquitecturas anteriores (iframe, proxy, middleware de auth viejo)
- Variables de entorno que ya no se usan
- Dependencias innecesarias

**4. Que falta:**

- Archivos que deberian existir y no existen
- Configuracion incompleta
- Patrones que no siguen las skills

Presentar el reporte al usuario y NO hacer cambios hasta que apruebe. Esto evita parches reactivos y errores por no conocer el estado completo del proyecto.

#### Despues del audit

1. Si el usuario pide cambios, implementarlos respetando las decisiones existentes del proyecto
2. Siempre seguir las demas skills de baseline (seguridad, testing, navegacion, git)
3. Si el proyecto viola reglas de baseline, informar al usuario y sugerir correcciones antes de avanzar

Si el proyecto existente no tiene los archivos de especificacion (specs/), NO crearlos retroactivamente salvo que el usuario lo pida.

---

## Spec-Driven Development (solo para proyectos nuevos)

Todo proyecto nuevo sigue el framework Spec-Driven Development. Antes de empezar, lee el README actualizado del framework en:
https://github.com/github/spec-kit

Seguir el proceso en 4 fases, en orden estricto. NO avanzar a la siguiente fase sin que el usuario revise y apruebe la fase actual.

### Fase 1: SPECIFY (especificar)

Generar un archivo `specs/spec.md` con la especificación completa del proyecto.
Contenido:

- Qué problema resuelve y para quién
- Flujos de usuario (qué hace el usuario paso a paso)
- Qué significa éxito (cómo se sabe que funciona bien)
- Qué NO incluye (alcance explícito)

NO incluir decisiones técnicas en esta fase. Solo el "qué" y el "por qué".
Mostrar al usuario para revisión. No avanzar hasta que apruebe.

### Fase 2: PLAN (planificar)

Generar un archivo `specs/plan.md` con el plan técnico.
Contenido:

- Stack tecnológico y justificación
- Arquitectura y estructura de carpetas
- Modelo de datos (tablas, relaciones)
- Integraciones externas (Supabase, APIs, etc.)
- Decisiones técnicas relevantes

Respetar las skills de baseline (seguridad, testing, navegación, git, design system).
Mostrar al usuario para revisión. No avanzar hasta que apruebe.

### Fase 3: TASKS (tareas)

Generar un archivo `specs/tasks.md` con las tareas desglosadas.
Cada tarea debe:

- Ser pequeña e implementable en aislamiento
- Tener un criterio claro de "terminado"
- Incluir qué tests se deben escribir (TDD: test primero, código después)
- Estar ordenadas por dependencia (las que no dependen de otras van primero)

Mostrar al usuario para revisión. No avanzar hasta que apruebe.

### Fase 4: IMPLEMENT (implementar)

Implementar tarea por tarea, en el orden definido.
Para cada tarea:

1. Escribir los tests primero (TDD)
2. Escribir el código mínimo que haga pasar los tests
3. Refactorizar si es necesario
4. Mostrar el resultado al usuario antes de pasar a la siguiente tarea

### Carpeta specs/

Todos los archivos de especificación se guardan en `specs/` en la raíz del proyecto:

- specs/spec.md
- specs/plan.md
- specs/tasks.md

Estos archivos son documentación viva del proyecto. Se actualizan si el alcance cambia.
