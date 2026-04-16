# Seguridad — Auth, Cookies y Acceso

Prerequisito: haber leído 02-endpoints.md
Siguiente: 04-deploy.md

---

## Auth independiente por app

Cada app maneja su propia autenticación. Todas usan el mismo proyecto de Supabase con Google OAuth, pero cada app tiene su propio dominio (subdominio de Railway), así que las cookies NO se comparten entre apps. El usuario hace login en cada app por separado.

### Configuración en Supabase (una sola vez para todas las apps)

En el dashboard de Supabase (https://supabase.com):

1. **Authentication → Providers → Google:**
   - Activar Google
   - Poner Client ID y Client Secret de Google OAuth

2. **Authentication → URL Configuration:**
   - Site URL: la URL de tu app (ej: `https://dashboard-suscripciones-production.up.railway.app`)
   - Redirect URLs: agregar la URL de callback de CADA app que exista:
     ```
     https://dashboard-suscripciones-production.up.railway.app/auth/callback
     https://otra-app-production.up.railway.app/auth/callback
     https://cf-innovation-hub-production.up.railway.app/auth/callback
     ```
   - Cada vez que se registra una app nueva en el Hub, hay que agregar su URL de callback aquí

3. **En Google Cloud Console:**
   - APIs & Services → Credentials → tu OAuth client
   - Authorized redirect URIs: agregar `{SUPABASE_URL}/auth/v1/callback` (una sola vez, no por app)

### Verificación de dominio

Solo emails @comunidadfeliz.cl pueden acceder. Verificar después del login:

```typescript
const email = session.user.email || "";
if (!email.endsWith("@comunidadfeliz.cl")) {
  await supabase.auth.signOut();
  // Mostrar error
}
```

---

## Implementación del login

### Página de login

Cada app necesita una página de login con un botón "Iniciar sesión con Google". Debe seguir el design system CF.

**Elementos:**

- Logo CF centrado
- Título de la app
- Subtítulo "Portal interno"
- Botón verde "Iniciar sesión con Google" (con ícono de Google)
- Texto "Solo cuentas @comunidadfeliz.cl"

### Flujo técnico (Next.js)

1. Página de login (`app/login/page.tsx` — "use client"):

```typescript
import { createClient } from "@/lib/supabase/client";

const handleLogin = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      skipBrowserRedirect: true, // OBLIGATORIO con @supabase/ssr
    },
  });

  if (error || !data.url) {
    setError("No se pudo iniciar sesión");
    return;
  }

  // Redirect manual — el SDK de @supabase/ssr NO redirige solo
  window.location.href = data.url;
};
```

2. Callback (`app/auth/callback/page.tsx` — "use client", NO route.ts):

```typescript
// IMPORTANTE: DEBE ser page.tsx (client-side)
// Los tokens van en el hash (#) que NUNCA llega al servidor
import { createClient } from "@/lib/supabase/client";

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
      // Verificar dominio
      if (!session.user.email?.endsWith("@comunidadfeliz.cl")) {
        supabase.auth.signOut();
        window.location.href = "/login?error=Solo cuentas @comunidadfeliz.cl";
        return;
      }
      window.location.href = "/";
    }
  });

  return () => {
    clearTimeout(timeout);
    subscription.unsubscribe();
  };
}, []);
```

3. Cliente Supabase (`lib/supabase/client.ts`):

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

4. Verificación de sesión en cada página protegida (middleware.ts o layout):

```typescript
// En layout.tsx o en cada página — "use client"
const supabase = createClient();
const {
  data: { session },
} = await supabase.auth.getSession();
if (!session) {
  window.location.href = "/login";
  return;
}
```

**ERRORES COMUNES EN NEXT.JS:**

- `signInWithOAuth` no redirige → usar `skipBrowserRedirect: true` + `window.location.href = data.url`
- Callback es route.ts → DEBE ser page.tsx (los tokens van en el hash #)
- `useSearchParams()` error en build → envolver en `<Suspense>`
- Middleware redirige a login aunque el usuario está logueado → la sesión está en localStorage, verificar client-side

---

## Control de acceso (público vs restringido)

Cada app verifica que el usuario esté logueado con un email @comunidadfeliz.cl. Eso es suficiente — la app es independiente.

```typescript
const supabase = createClient();
const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  window.location.href = "/login";
  return;
}
if (!session.user.email?.endsWith("@comunidadfeliz.cl")) {
  await supabase.auth.signOut();
  // Mostrar error
}
// OK — mostrar contenido
```

### Rutas públicas (sin auth)

Si la app declara `publicRoutes` en hub.config.json, esas rutas son accesibles sin login. El middleware DEBE verificar si la ruta es pública antes de redirigir:

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALWAYS_PUBLIC = ["/login", "/auth/callback", "/api/health"];
// Leer de hub.config.json o definir directamente
const APP_PUBLIC_ROUTES: string[] = [];

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
  // Rutas protegidas — la verificación real se hace client-side
  return NextResponse.next();
}
```

**IMPORTANTE:** En rutas públicas, la sesión puede no existir. El código de la página DEBE funcionar sin sesión. No llamar a endpoints protegidos desde páginas públicas.

---

## Autenticacion publica (public_auth)

La capability `public_auth` permite que usuarios externos (no @comunidadfeliz.cl) se autentiquen via Google OAuth y accedan a rutas bajo `/public/`. Las rutas internas (`/dashboard/*`) siguen restringidas a usuarios @comunidadfeliz.cl.

### Flujo

1. El usuario externo accede a `/public/login`
2. Hace login con Google OAuth (misma config de Supabase)
3. Antes del redirect, se guarda `auth_flow=public` en `sessionStorage` y se pasa `?flow=public` como query param en el `redirectTo`
4. El callback (`/auth/callback`) recibe la sesion y verifica el email:
   - Si `@comunidadfeliz.cl` → redirige a `/dashboard` (flujo interno normal)
   - Si NO y el flujo es `public` → redirige a `/public/dashboard`
   - Si NO y el flujo NO es `public` → cierra sesion y muestra error en `/login`

### Archivos

- `lib/auth-public.ts` — Utilidades compartidas:
  - `isInternalUser(email)`: verifica si el email es del dominio interno
  - `getPublicRedirect()`: retorna la ruta destino para usuarios externos
- `app/(public)/public/login/page.tsx` — Login publico (sin verificacion de dominio)
- `app/(public)/public/dashboard/page.tsx` — Dashboard de ejemplo para usuarios externos
- `app/auth/callback/page.tsx` — Maneja ambos flujos (interno y publico)

### Configuracion

En `hub.config.json`, activar con `"publicAuth": true`. Por defecto esta desactivado.

### Reglas de seguridad

- Las rutas internas (`/dashboard/*`) SIEMPRE requieren `@comunidadfeliz.cl`
- Las rutas publicas (`/public/*`) permiten cualquier cuenta de Google autenticada
- NO exponer datos sensibles en paginas publicas, aunque el usuario este autenticado
- El middleware no necesita cambios: las rutas `/public/*` ya estan en `PUBLIC_ROUTES`
- Para proteger una ruta publica con sesion (que el usuario este logueado pero no necesariamente interno), verificar sesion client-side y redirigir a `/public/login` si no hay sesion

---

## Agregar URL de callback en Supabase al registrar una app

El Hub agrega automaticamente la URL de callback de cada app nueva a Supabase via Management API al momento del deploy. No es necesario hacerlo manualmente.

Si por alguna razon necesitas agregarlo manual:

1. Ir a Supabase Dashboard -> Authentication -> URL Configuration
2. En Redirect URLs, agregar: `https://{slug}-production.up.railway.app/auth/callback`
3. Guardar

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

## Siguiente archivo

Lee ahora: **04-deploy.md**
