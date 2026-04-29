# Métricas de Proyecto — ComunidadFeliz Innovation Hub

Estas reglas son obligatorias para todas las apps del Innovation Hub. Claude Code debe seguirlas siempre.

## Principio

Todas las apps del Innovation Hub deben exponer métricas estandarizadas que el Hub consume para monitorear el estado, uso y salud de cada proyecto. Las métricas no se envían en tiempo real; el Hub las consulta bajo demanda (botón de refresh).

## Endpoints obligatorios

Cada app debe exponer tres endpoints:

### GET /api/health

Responde si la app está viva. Respuesta mínima:

- status: "ok" o "error"
- timestamp: fecha y hora actual
- version: versión de la app (opcional pero recomendado)

### GET /api/metrics/menu

Le dice al Hub qué métricas tiene disponibles esta app. Responde una lista donde cada métrica tiene:

- key: identificador único de la métrica (ej: "requests_today")
- name: nombre legible (ej: "Requests hoy")
- category: categoría (availability, usage, errors, engagement, commands, endpoints, cron)
- type: tipo de valor (number, percentage, timestamp, ranking)

El Hub lee este menú para saber qué mostrar en el dashboard de admin. Si una app agrega métricas nuevas, el Hub las descubre automáticamente.

### GET /api/metrics

Responde los valores actuales de todas las métricas. Cada métrica tiene:

- key: mismo identificador que en el menú
- value: el valor actual

Estos endpoints deben estar protegidos con un API key (variable de entorno METRICS_API_KEY) que el Hub envía en el header. No son públicos.

## Métricas base (obligatorias en todas las apps)

Independiente del tipo de app, estas métricas siempre deben implementarse:

### Disponibilidad (category: availability)

- response_time_ms: tiempo de respuesta del health check en milisegundos
- uptime_7d: porcentaje de uptime en los últimos 7 días
- uptime_30d: porcentaje de uptime en los últimos 30 días
- last_healthy: timestamp del último health check exitoso
- last_unhealthy: timestamp del último health check fallido (null si nunca falló)

### Uso general (category: usage)

- requests_today: cantidad de requests recibidos hoy
- requests_7d: cantidad de requests últimos 7 días
- requests_30d: cantidad de requests últimos 30 días
- unique_users_today: usuarios únicos que accedieron hoy
- unique_users_7d: usuarios únicos últimos 7 días
- unique_users_30d: usuarios únicos últimos 30 días
- last_access: timestamp del request más reciente

### Errores (category: errors)

- errors_4xx_today: errores 4xx hoy
- errors_5xx_today: errores 5xx hoy
- errors_4xx_30d: errores 4xx últimos 30 días
- errors_5xx_30d: errores 5xx últimos 30 días
- error_rate: porcentaje de errores sobre requests totales (últimos 30 días)

## Métricas adicionales por tipo de app

Cada app implementa las métricas adicionales según su tipo. El tipo se define al registrar el proyecto en el Hub.

### Tipo: frontend (dashboards, herramientas con interfaz)

#### Engagement (category: engagement)

- top_pages: ranking de páginas más visitadas (lista con nombre y cantidad)
- avg_session_duration_s: tiempo promedio de sesión en segundos
- actions_today: acciones realizadas hoy (clicks, formularios, reportes)
- dau: usuarios activos diarios
- wau: usuarios activos semanales
- mau: usuarios activos mensuales

#### Performance (category: performance)

- avg_page_load_ms: tiempo de carga promedio de la página en milisegundos
- avg_response_size_kb: tamaño promedio de respuesta en KB

### Tipo: slack_bot (bots de Slack)

#### Comandos (category: commands)

- commands_today: cantidad de comandos recibidos hoy
- commands_7d: cantidad de comandos últimos 7 días
- commands_30d: cantidad de comandos últimos 30 días
- unique_bot_users: usuarios únicos que usaron el bot (30 días)
- top_commands: ranking de comandos más usados (lista con comando y cantidad)
- avg_command_response_ms: tiempo promedio de respuesta a un comando en milisegundos
- failed_commands_today: comandos que fallaron hoy
- command_success_rate: porcentaje de comandos exitosos (últimos 30 días)

### Tipo: api (APIs e integraciones)

#### Endpoints (category: endpoints)

- top_endpoints: ranking de endpoints más usados (lista con path y cantidad)
- avg_response_time_by_endpoint: tiempo de respuesta por endpoint (lista con path y promedio ms)
- slowest_endpoints: endpoints más lentos (lista con path y p95 ms)
- requests_per_hour_peak: pico de requests por hora (últimos 7 días)
- requests_per_hour_avg: promedio de requests por hora (últimos 7 días)
- avg_payload_size_kb: tamaño promedio de payload en KB

### Tipo: cron (tareas automáticas)

#### Ejecuciones (category: cron)

- executions_today: ejecuciones hoy
- executions_7d: ejecuciones últimos 7 días
- executions_30d: ejecuciones últimos 30 días
- last_success: timestamp de la última ejecución exitosa
- last_failure: timestamp de la última ejecución fallida (null si nunca falló)
- avg_duration_s: duración promedio de ejecución en segundos
- cron_success_rate: porcentaje de ejecuciones exitosas (últimos 30 días)
- slow_executions_30d: ejecuciones que excedieron el tiempo esperado (últimos 30 días)

## Cómo el Hub consume las métricas

1. El Hub llama a /api/metrics/menu de cada proyecto para descubrir qué métricas tiene
2. El Hub llama a /api/metrics de cada proyecto para obtener los valores
3. El Hub muestra las métricas en el dashboard de admin, organizadas por categoría
4. El admin puede hacer refresh manualmente (botón), no hay actualización en tiempo real
5. El Hub guarda un historial de métricas en su propia base de datos para mostrar tendencias

## Implementación en cada app

- Las métricas se calculan a partir de logs internos de la app o de tablas de auditoría
- Cada app es responsable de trackear sus propios datos (requests, errores, acciones)
- Se recomienda usar un middleware que registre cada request (método, path, status code, duración, user_id)
- Las métricas de disponibilidad (uptime) las calcula el Hub a partir de los health checks, no la app
