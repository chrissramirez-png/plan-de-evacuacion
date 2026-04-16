# Reglas de Seguridad — ComunidadFeliz Innovation Hub

Estas reglas son obligatorias para todas las apps del Innovation Hub. Claude Code debe seguirlas siempre.

---

## Secretos y variables de entorno

- NUNCA poner contrasenas, API keys, tokens o credenciales directamente en el codigo
- Todos los secretos van en variables de entorno
- El archivo `.env` SIEMPRE debe estar en `.gitignore`
- Cada proyecto debe tener un `.env.example` con los nombres de las variables (sin valores reales)
- Las variables de entorno las configura el Hub automaticamente al deployar en Railway. NO configurarlas manualmente

---

## Autenticacion

### Modelo: cada app implementa su propio auth

Todas las apps usan el **mismo proyecto Supabase** con Google OAuth. Cada app implementa auth de forma independiente.

### Para las apps (Next.js)

- Usa Supabase Auth con Google OAuth
- Client-side: `@supabase/ssr` con `createBrowserClient`
- Middleware (`middleware.ts`) para verificar rutas publicas vs protegidas
- Paginas `/login` (page.tsx) y `/auth/callback` (page.tsx, client-side)
- Verificar dominio del email contra @comunidadfeliz.cl

### Para el Hub (Next.js)

- Usa Supabase Auth con Google OAuth
- Client-side: `@supabase/supabase-js` directo (singleton, localStorage)
- API routes: Bearer token via `authFetch` -> validacion con `verifyToken`
- Middleware: SKIP todas las rutas /api/ (auth interno con verifyToken)

---

## Row Level Security (RLS)

- TODAS las tablas en Supabase deben tener RLS habilitado
- Cada tabla debe tener policies que definan quien puede leer, escribir, actualizar y eliminar
- Nunca deshabilitar RLS "temporalmente" para que algo funcione
- CUIDADO con policies recursivas: una policy en `profiles` que consulta `profiles` causa loop infinito. Usar `auth.role()` en vez de subconsultas a la misma tabla

### Cuando usar USING (true)

No todas las tablas requieren restriccion por usuario. Elegir segun el tipo de datos:

- **Tablas publicas** (contenido compartido, FAQ, config): `USING (true)` es correcto. Agregar `GRANT SELECT ON {schema}.tabla TO anon` para que usuarios no autenticados puedan leer
- **Tablas con datos de usuarios**: NUNCA `USING (true)`. Usar `USING (auth.uid() = user_id)` para restringir al dueño
- **Tablas mixtas** (parte publica, parte privada): usar campo `is_public` — policy `USING (is_public = true)` para lectura anonima + `USING (auth.uid() = owner_id)` para el dueño
- **Escritura publica** (formularios anonimos, feedback): `WITH CHECK (true)` permite inserts sin auth. Combinar con `GRANT INSERT ON {schema}.tabla TO anon`

---

## Headers de seguridad

Configurados en `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
```

---

## Sanitizacion de datos

- Toda entrada del usuario debe ser sanitizada antes de procesarla
- NO construir queries SQL concatenando strings. Siempre usar el SDK de Supabase o parametros preparados
- Validar tipos de datos en el servidor, no solo en el frontend
- Escapar contenido HTML antes de renderizarlo para prevenir XSS
- Limitar el tamano de inputs (textos, archivos) para prevenir abuso

---

## Schema aislado

- Cada app tiene su propio schema en Supabase (el slug de la app)
- **TODAS** las tablas de la app van en su schema, **NUNCA en public**
- El schema `public` es gestionado exclusivamente por el Hub. Las migraciones que intenten crear objetos en `public` seran rechazadas
- El Hub crea el schema automaticamente al registrar el proyecto
- Para consultar tablas del schema propio, usar `.schema("mi_app")` en el cliente de Supabase
- La migracion debe incluir `GRANT USAGE ON SCHEMA` para `anon`, `authenticated` y `service_role`
- NUNCA escribir en schemas de otras apps

---

## Proteccion de endpoints de metricas

Los endpoints /api/metrics/menu y /api/metrics deben estar protegidos con API key:

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

El endpoint /api/health NO requiere API key (es publico).

---

## Dependencias

- No instalar dependencias que no sean estrictamente necesarias
- Preferir librerias con mantenimiento activo y sin vulnerabilidades conocidas
- El lock file (package-lock.json) siempre debe commitearse

---

## Errores

- NO exponer stack traces, mensajes de error internos ni informacion del servidor al usuario
- Mensajes genericos para el usuario, logs detallados en el servidor
- No loggear secretos, tokens ni datos personales

---

## Lo que NUNCA hacer

- Deshabilitar RLS
- Poner secretos en el codigo
- Crear servicios en Railway manualmente (solo desde el Hub)
- Acceder a schemas de otras apps
- Usar `fetch` directo para API routes del Hub (siempre `authFetch`)
- Crear policies RLS que consulten la misma tabla (causa recursion infinita)
