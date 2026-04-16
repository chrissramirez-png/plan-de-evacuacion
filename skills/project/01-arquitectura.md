# Arquitectura — Apps del Innovation Hub

Prerequisito: ninguno. LEER PRIMERO.
Siguiente: 02-endpoints.md

**IMPORTANTE:** Esta skill es para proyectos que se conectan al Innovation Hub. Si estás trabajando en el repo del Hub (`cf-innovation-hub`), esta skill NO aplica.

---

## Reglas críticas (leer antes que cualquier cosa)

1. **Cada app implementa su propio auth** — Supabase Google OAuth, mismo proyecto Supabase que el Hub. El usuario hace login por separado en cada app.
2. **Header estándar obligatorio** — logo CF (link al Hub), nombre de la app, usuario, salir
3. **Endpoints API retornan JSON siempre** — nunca HTML en errores
4. **Cada app nueva debe agregar su URL de callback en Supabase** — ver 03-seguridad-app.md

---

## Cómo funciona

El Innovation Hub es un catálogo central que registra, despliega y monitorea apps internas de ComunidadFeliz. Cada app es independiente — tiene su propio dominio en Railway, su propio auth, y su propio contenido.

Todas las apps comparten:

- El mismo proyecto de Supabase (auth + datos)
- El mismo Google OAuth config
- El mismo design system (Montserrat, colores CF)

Cada app tiene su propia URL de Railway (ej: `mi-app-production.up.railway.app`). El usuario hace login por separado en cada app — todas usan el mismo botón "Iniciar sesión con Google" y el mismo proyecto de Supabase.

### Flujo de un usuario

1. Entra a la URL de tu app
2. Si la ruta es pública → ve el contenido sin login (ver "Vistas públicas" más abajo)
3. Si la ruta es protegida y no tiene sesión → ve pantalla de login ("Iniciar sesión con Google")
4. Hace login con Google → Supabase autentica → redirige de vuelta
5. Ve la app
6. Si entra a otra app → tiene que hacer login de nuevo (dominio diferente, cookies no se comparten)

---

## Lo que cada app implementa

### Auth propio

Cada app verifica la sesión de Supabase. Si no hay sesión, muestra pantalla de login. El login usa Google OAuth del mismo proyecto Supabase que el Hub. Ver 03-seguridad-app.md para los detalles de implementación.

### Header estándar

Todas las apps tienen el mismo header. Ver sección "Header estándar" más abajo.

### hub.config.json

Archivo de configuración en la raíz del repo que le dice al Hub todo sobre tu app. Ver deploy-config.md (baseline).

### Endpoints obligatorios

/api/health, /api/metrics/menu, /api/metrics. Ver 02-endpoints.md.

### Verificación de acceso

Si la app es restringida, verificar con el Hub. Ver 03-seguridad-app.md.

## Lo que cada app NO implementa

- Registro de usuarios (Supabase lo maneja)
- Gestión de accesos (el Hub lo maneja)
- Deploy de otras apps (el Hub lo maneja)
- Logo CF / "Volver al Hub" / botón salir fuera del header (ya están en el header)

---

## Vistas públicas (sin auth)

Algunas apps necesitan rutas accesibles sin autenticación (ej: landing page, pricing, documentación pública). El template soporta esto de forma opcional.

### Cómo funciona

1. La app declara sus rutas públicas en `hub.config.json` → campo `publicRoutes`
2. El middleware de Next.js verifica si la ruta actual es pública antes de redirigir a login
3. Las rutas no listadas en `publicRoutes` siguen requiriendo auth como siempre

### Reglas

- Si `publicRoutes` no existe o está vacío, TODAS las rutas requieren auth (comportamiento por defecto)
- `/login`, `/auth/callback` y `/api/health` son siempre públicas (no hace falta declararlas)
- Las rutas públicas NUNCA deben exponer datos sensibles ni de otros usuarios
- Los endpoints API públicos usan la convención `/api/public/*`

### Auth guard condicional (middleware.ts)

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import hubConfig from "./hub.config.json";

const ALWAYS_PUBLIC = ["/login", "/auth/callback", "/api/health"];
const APP_PUBLIC_ROUTES: string[] = hubConfig.publicRoutes || [];

function isPublicRoute(path: string): boolean {
  return (
    ALWAYS_PUBLIC.some((r) => path.startsWith(r)) ||
    APP_PUBLIC_ROUTES.some((r) => path === r || path.startsWith(r + "/"))
  );
}

export function middleware(request: NextRequest) {
  if (isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  // Ruta protegida — verificar sesión client-side
  return NextResponse.next();
}
```

### Header en rutas públicas

El header se adapta según si hay sesión o no:

```
┌──────────────────────────────────────────────────────────────┐
│ [← CF Catálogo]  │  Nombre App              [Iniciar sesión] │  56px  (sin sesión)
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ [← CF Catálogo]  │  Nombre App    [🌙] [Usuario] [Salir]    │  56px  (con sesión)
└──────────────────────────────────────────────────────────────┘
```

- Sin sesión: muestra botón "Iniciar sesión" en lugar de usuario/salir
- Con sesión: header completo como siempre

### Supabase RLS para datos públicos

Si una ruta pública necesita leer datos de Supabase sin auth:

```sql
-- Policy para lectura pública (sin auth requerido)
CREATE POLICY "public_read" ON app_schema.tabla
  FOR SELECT USING (is_public = true);
```

Separar datos públicos de privados en tablas diferentes o con un campo `is_public`. NUNCA crear una policy `USING (true)` sin filtro en una tabla con datos sensibles.

---

## Header estándar

Todas las apps DEBEN tener este header. Es lo que da consistencia visual entre apps.

```
┌──────────────────────────────────────────────────────────────┐
│ [← CF Catálogo]  │  Nombre App    [🌙] [Usuario] [Salir]    │  56px
└──────────────────────────────────────────────────────────────┘
```

### Elementos

| Elemento             | Descripción                                           | Acción                         |
| -------------------- | ----------------------------------------------------- | ------------------------------ |
| Logo CF + "Catálogo" | Logo cf-logo-square.webp (24-28px) + texto "Catálogo" | Link a `{NEXT_PUBLIC_HUB_URL}` |
| Separador            | Línea vertical 1px                                    | —                              |
| Nombre de la app     | Texto, 16px Montserrat Medium                         | —                              |
| Toggle dark mode     | Ícono sol/luna                                        | Alterna modo claro/oscuro      |
| Usuario              | Avatar circular con inicial + nombre                  | —                              |
| Salir                | Texto                                                 | Cierra sesión de Supabase      |

### Estilos

| Propiedad      | Modo claro                        | Modo oscuro            |
| -------------- | --------------------------------- | ---------------------- |
| Altura         | 56px                              | 56px                   |
| Fondo          | #FFFFFF                           | #1A1A2E                |
| Borde inferior | 1px solid #EDEEF0                 | 1px solid #4C516D      |
| Shadow         | `0 1px 5px rgba(129,155,184,0.3)` | —                      |
| Tipografía     | Montserrat Medium 14px            | Montserrat Medium 14px |
| Nombre app     | 16px                              | 16px                   |

### Cómo implementar

```tsx
// components/layout/Header.tsx
<header className="h-14 flex items-center justify-between px-4 bg-white dark:bg-[#1A1A2E] border-b border-[#EDEEF0] dark:border-[#4C516D] shadow-[0_1px_5px_rgba(129,155,184,0.3)] dark:shadow-none">
  <div className="flex items-center gap-3">
    <a
      href={process.env.NEXT_PUBLIC_HUB_URL}
      className="flex items-center gap-2 text-[#4C516D] no-underline"
    >
      <img src="/cf-logo-square.webp" alt="CF" width={24} height={24} />
      <span className="text-sm font-medium">Catálogo</span>
    </a>
    <div className="w-px h-6 bg-[#EDEEF0]" />
    <span className="text-base font-medium text-[#4C516D]">Mi App</span>
  </div>
  <div className="flex items-center gap-3">
    {/* toggle dark mode, usuario, salir */}
  </div>
</header>
```

---

## Variables de entorno

El Hub configura automáticamente al deployar:

```
NEXT_PUBLIC_SUPABASE_URL      — URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY — Anon key de Supabase
NEXT_PUBLIC_HUB_URL           — URL del Hub
METRICS_API_KEY               — Para proteger endpoints de métricas
DB_SCHEMA                     — Schema aislado en Supabase (app_{slug})
```

Las variables adicionales específicas de tu app se declaran en hub.config.json → env_required. El Hub las pide al admin al deployar.

---

---

## Traps conocidos (errores que se repiten)

Estos errores ya han ocurrido. SIEMPRE verificar que no existan antes de deployar:

| Trap                                          | Causa                                                                                          | Solucion                                                                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Variables NEXT*PUBLIC*\* vacias en produccion | Se embeben en build time, no runtime                                                           | Forzar rebuild despues de configurar variables en Railway                                                         |
| Auth callback falla silenciosamente           | Callback es route.ts (server)                                                                  | DEBE ser page.tsx (client-side). El hash # nunca llega al servidor                                                |
| Auth callback se queda en "Autenticando..."   | `getSession()` en /auth/callback no encuentra sesion porque el hash fragment aun no se proceso | SIEMPRE usar `onAuthStateChange` en el callback, NO `getSession()`. Esperar evento `SIGNED_IN` con timeout de 10s |
| `supabase.auth.getSession()` retorna null     | Session esta en localStorage, no en cookies                                                    | Leer token directo de localStorage o usar `onAuthStateChange`                                                     |
| Login no redirige a Google                    | `signInWithOAuth` no redirige automaticamente                                                  | SIEMPRE usar `skipBrowserRedirect: true` + `window.location.href = data.url`                                      |
| `useSearchParams()` error en build            | Next.js requiere Suspense boundary                                                             | Envolver componente que usa `useSearchParams()` en `<Suspense>`                                                   |

---

## Guardrails para auth (OBLIGATORIO)

Estas reglas previenen los bugs mas comunes. Son OBLIGATORIAS para todas las apps:

### 1. En /auth/callback SIEMPRE usar onAuthStateChange

```typescript
// app/auth/callback/page.tsx — "use client"
useEffect(() => {
  const supabase = createClient();
  const timeout = setTimeout(() => {
    window.location.href = "/login?error=Timeout";
  }, 10000);

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      clearTimeout(timeout);
      window.location.href = "/";
    }
  });

  return () => {
    clearTimeout(timeout);
    subscription.unsubscribe();
  };
}, []);
```

### 2. SIEMPRE poner timeout en el callback

Si algo falla en el flujo OAuth (red lenta, popup bloqueado, etc.), sin timeout la pagina se queda colgada para siempre. Timeout de 10 segundos con redirect a login.

### 3. SIEMPRE verificar sesión antes de hacer API calls

```typescript
const supabase = createClient();
const {
  data: { session },
} = await supabase.auth.getSession();
if (!session) {
  window.location.href = "/login";
  throw new Error("No autenticado");
}
```

---

## Siguiente archivo

Lee ahora: **02-endpoints.md**
