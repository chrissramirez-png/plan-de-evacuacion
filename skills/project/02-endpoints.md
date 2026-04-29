# Endpoints y Manejo de Errores — Apps del Innovation Hub

Prerequisito: haber leído 01-arquitectura.md
Siguiente: 03-seguridad-app.md

---

## Endpoints obligatorios

Cada app DEBE exponer 3 endpoints. El Hub los usa para monitoreo.

### GET /api/health

Responde si la app está viva. Sin autenticación. El Hub lo consulta periódicamente.

**Respuesta esperada:**

```json
{ "status": "ok", "timestamp": "2026-03-20T18:00:00.000Z", "version": "1.0.0" }
```

```typescript
// app/api/health/route.ts
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
}
```

### GET /api/metrics/menu

Lista las métricas que tu app expone. Protegido con header `x-api-key`.

**Respuesta esperada:**

```json
[
  {
    "key": "requests_today",
    "name": "Requests hoy",
    "category": "usage",
    "type": "number"
  },
  {
    "key": "error_rate",
    "name": "Tasa de error",
    "category": "errors",
    "type": "percentage"
  }
]
```

Categorías válidas: `availability`, `usage`, `errors`, `engagement`, `performance`, `commands`, `endpoints`, `cron`
Tipos válidos: `number`, `percentage`, `timestamp`, `ranking`

Ver metricas.md (baseline) para la lista completa de métricas obligatorias.

### GET /api/metrics

Valores actuales de las métricas. Protegido con header `x-api-key`.

**Respuesta esperada:**

```json
[
  { "key": "requests_today", "value": 142 },
  { "key": "error_rate", "value": 1.2 }
]
```

### Protección de /api/metrics/menu y /api/metrics

Estos endpoints solo los consume el Hub. Verificar el header `x-api-key`:

```typescript
// app/api/metrics/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.METRICS_API_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  // ... retornar métricas
}
```

---

## Endpoints API públicos (opcional)

Solo si una vista pública necesita cargar datos dinámicos (no estáticos), la app puede crear endpoints sin auth usando la convención `/api/public/*`. La mayoría de las vistas públicas no necesitan esto — si la página es HTML estático, no crear estos endpoints.

```typescript
// app/api/public/features/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const resultado = await obtenerFeaturesPublicos();
    return NextResponse.json(resultado);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

**Reglas:**

- SOLO crearlos si una vista pública necesita fetch de datos — no por defecto
- SOLO devuelven datos marcados como públicos — nunca datos de usuarios ni datos sensibles
- NO requieren `x-api-key` ni Bearer token
- Siguen la misma regla de retornar JSON siempre (nunca HTML)

---

## REGLA: Endpoints API SIEMPRE retornan JSON

Todos los endpoints DEBEN retornar JSON tanto en éxito como en error.

### Wrappear cada endpoint en try/catch

```typescript
// app/api/datos/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const resultado = await obtenerDatos();
    return NextResponse.json(resultado);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

---

## REGLA: Validar respuestas en el frontend

El frontend DEBE validar las respuestas de la API antes de usarlas. Si no, un error de la API crashea toda la UI.

```javascript
// ❌ MAL — crashea si la API falla
const data = await res.json();
data.items.filter(...)  // TypeError si data es {error: "..."}

// ✅ BIEN — valida antes de usar
if (!res.ok) {
  setError("Error cargando datos");
  return;
}
const data = await res.json();
if (!Array.isArray(data.items)) {
  setError("Datos inválidos");
  return;
}
data.items.filter(...)
```

**Regla:** NUNCA asumir que la respuesta tiene la estructura esperada. Siempre verificar `res.ok`, verificar que los campos existan, y mostrar un mensaje de error al usuario.

---

## Siguiente archivo

Lee ahora: **03-seguridad-app.md**
