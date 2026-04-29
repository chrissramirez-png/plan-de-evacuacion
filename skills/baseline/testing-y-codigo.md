# Reglas de Testing y Código — ComunidadFeliz Innovation Hub

Estas reglas son obligatorias para todas las apps del Innovation Hub. Claude Code debe seguirlas siempre.

## Test-Driven Development (TDD)

El desarrollo sigue el ciclo TDD: primero el test, después el código.

### Flujo obligatorio para cada funcionalidad nueva

1. Escribir el test que define el comportamiento esperado. El test debe fallar (porque el código no existe aún)
2. Escribir el código mínimo que haga pasar el test. Nada más que lo necesario
3. Refactorizar el código manteniendo los tests pasando. Mejorar estructura, nombres, legibilidad
4. Repetir para la siguiente funcionalidad

### Qué se testea con TDD (obligatorio)

- Lógica de negocio: cálculos, transformaciones de datos, validaciones, reglas
- Endpoints de API: que respondan correctamente con datos válidos, que rechacen datos inválidos, que manejen errores
- Autenticación y permisos: que usuarios no autorizados no accedan, que los roles funcionen correctamente
- Funciones de utilidad: cualquier función en lib/ o utils/

### Qué NO se testea con TDD (opcional testear después)

- Componentes de UI puramente visuales (un botón con un color, un layout)
- Configuraciones de terceros (la conexión a Supabase funciona, eso lo testea Supabase)
- Estilos CSS

### Cómo nombrar los tests

- Describir el comportamiento, no la implementación
- Usar el formato: "debería [resultado esperado] cuando [condición]"
- Ejemplos:
  - "debería rechazar acceso cuando el usuario no tiene rol admin"
  - "debería retornar status 200 cuando el health check es exitoso"
  - "debería crear el schema cuando se registra un proyecto nuevo"
- NO: "test función X", "test endpoint", "test 1"

## Frameworks de testing

- Vitest (con jsdom para componentes React)
- Los tests se ubican junto al código que testean, en archivos con sufijo `.test.ts`
- Estructura ejemplo:
  - `lib/permissions.ts` → `lib/permissions.test.ts`
  - `app/api/health/route.ts` → `app/api/health/route.test.ts`

## Cobertura

- Mínimo sugerido: 60% para lógica de negocio
- La cobertura no es bloqueante para merge, pero se revisa en el code review
- Lo importante no es el número de cobertura sino que los casos críticos estén cubiertos (permisos, auth, cálculos)

## Pre-commit hooks (Husky + lint-staged)

Cada proyecto DEBE incluir pre-commit hooks que se ejecutan automáticamente en cada commit, ANTES de que el código llegue a GitHub. Si alguna verificación falla, el commit se rechaza.

### Configuración obligatoria

- Instalar Husky y lint-staged como dependencias de desarrollo
- Configurar los siguientes hooks:

### Hook pre-commit (corre en cada commit)

1. Lint: ejecutar ESLint sobre los archivos modificados
2. Formato: ejecutar Prettier sobre los archivos modificados
3. Secretos: verificar que no haya API keys, tokens o credenciales en los archivos modificados
4. Tests: ejecutar los tests relacionados con los archivos modificados

### Hook commit-msg (valida el mensaje de commit)

1. Commitlint: verificar que el mensaje siga el formato de Conventional Commits
2. Si el mensaje no cumple el formato, rechazar el commit con un mensaje explicando el formato correcto

### Qué verifican los hooks (resumen)

- Que el código pase lint sin errores
- Que el código esté formateado correctamente
- Que no haya secretos expuestos en el código
- Que los tests pasen
- Que el mensaje de commit siga Conventional Commits

### Importante

- Los hooks corren localmente en la máquina del usuario, antes de que el código llegue a GitHub
- Son una primera línea de defensa. GitHub Actions (CI/CD en el servidor) es la segunda línea
- NO se pueden saltar los hooks (a menos que se use --no-verify, que debería estar prohibido en las reglas del equipo)
- Husky se configura una vez en el proyecto y aplica automáticamente a todos los que clonan el repo

## Linting y formato

- ESLint + Prettier
- El código debe pasar lint sin errores antes de hacer commit
- Incluir eslint-plugin-security para detectar patrones inseguros
- NO deshabilitar reglas de lint con comentarios (// eslint-disable) salvo casos justificados con comentario explicativo

## TypeScript

- Modo relajado (no strict) para proyectos con interfaz
- Dejar que TypeScript infiera tipos cuando sea obvio
- Tipar explícitamente: parámetros de funciones, respuestas de API, interfaces de datos
- NO usar `any` salvo casos donde no hay alternativa, con comentario explicando por qué

## Conventional Commits

- Todos los mensajes de commit siguen Conventional Commits
- Formato: tipo(alcance opcional): descripción corta
- Tipos válidos:
  - feat: nueva funcionalidad
  - fix: corrección de bug
  - docs: cambios en documentación
  - style: cambios de formato que no afectan lógica
  - refactor: reestructuración sin cambio funcional
  - test: agregar o modificar tests
  - chore: tareas de mantenimiento
- La descripción en español, concisa, en minúsculas, sin punto final
- Ejemplos correctos:
  - feat: agregar login con google oauth
  - fix: corregir validación de email en formulario
  - test: agregar tests para permisos de admin
  - chore: actualizar dependencias de supabase
- Ejemplos incorrectos:
  - Update files (no sigue el formato)
  - feat: Agregar Login (no usar mayúsculas en la descripción)
  - fix: se arregló el bug. (no usar punto final ni pasado)

## Estructura de código

- Separar lógica de negocio de la UI. No poner queries a la BD ni cálculos complejos directamente en componentes React
- Funciones y archivos pequeños. Si una función supera 50 líneas, considerar dividirla
- Nombres descriptivos en español o inglés (ser consistente dentro del proyecto, no mezclar)
- Comentar el "por qué", no el "qué". El código debe ser autoexplicativo; los comentarios explican decisiones no obvias

## CI/CD (GitHub Actions)

- Los tests corren automáticamente en cada push y PR
- Si los tests fallan, el PR no se puede mergear
- El pipeline mínimo: instalar dependencias → lint → tests → security scan
- GitHub Actions es la segunda línea de defensa después de los pre-commit hooks
