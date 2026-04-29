# Navegacion Estandar — ComunidadFeliz Innovation Hub

Regla obligatoria para todas las apps del Innovation Hub. Claude Code debe seguirla siempre.

---

## Principio

Cada app del Innovation Hub es **independiente**. Tiene su propia URL, su propio auth, y su propia navegacion. NO se cargan en iframes. El Hub es solo un portal de administracion.

La experiencia debe ser consistente: todas las apps comparten el **Header CF** (56px) y opcionalmente un **Sidebar** colapsable. Cada app maneja su navegacion interna con estos componentes.

---

## Header (`components/layout/Header.tsx`) — Obligatorio en todas las apps

Todas las apps DEBEN mostrar el header de ComunidadFeliz en la parte superior.

### Contenido del header

- Logo CF: cf-logo-square.webp, alineado a la izquierda, link al Hub (`NEXT_PUBLIC_HUB_URL`)
- Separador vertical 1px
- Nombre de la app (16px Montserrat Medium)
- Toggle dark/light mode (icono sol/luna)
- Nombre del usuario (leido de Supabase session)
- Boton "Salir" (cierra sesion de Supabase)

### Estilos

- Altura: 56px
- Fondo claro: #FFFFFF / Fondo oscuro: #1A1A2E
- Borde inferior claro: 1px solid #EDEEF0 / oscuro: 1px solid #4C516D
- Shadow claro: `0 1px 5px rgba(129,155,184,0.3)` / oscuro: ninguno
- Texto: Montserrat Medium 14px
- Posicion: fixed, top: 0, z-index: 1000

### Comportamiento segun sesion

- Con sesion: muestra toggle dark mode, nombre de usuario, boton "Salir"
- Sin sesion (ruta publica): muestra boton "Iniciar sesion" en lugar de usuario/salir

---

## Sidebar (`components/layout/Sidebar.tsx`) — Opcional

Para apps que necesitan navegacion lateral.

### Comportamiento

- Desktop: sidebar colapsable (expandido 220px, colapsado 48px)
- Mobile: drawer que se abre con boton hamburguesa
- Posicion: fixed, top: 56px (debajo del header), left: 0
- El contenido principal tiene margin-left igual al ancho del sidebar

### Configuracion

La app define sus items de navegacion en un array `links`:

```typescript
// components/layout/Sidebar.tsx
const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/builder", label: "Builder", icon: Grid },
  { href: "/settings", label: "Configuracion", icon: Settings },
];
```

Cada link tiene: `href` (ruta interna), `label` (texto visible), `icon` (componente de Lucide icons).

---

## AppLayout (`components/layout/AppLayout.tsx`)

Componente que envuelve Header + Sidebar + contenido principal. Todas las paginas protegidas lo usan:

```tsx
// app/layout.tsx o pagina especifica
<AppLayout>
  <div>{/* contenido de la pagina */}</div>
</AppLayout>
```

AppLayout se encarga de:

- Renderizar el Header en la parte superior
- Renderizar el Sidebar a la izquierda (si la app lo usa)
- Aplicar el padding/margin correcto al contenido principal
- Manejar el estado colapsado/expandido del sidebar

---

## ThemeProvider

Maneja el toggle dark/light mode.

- Persiste la preferencia en localStorage
- Aplica la clase `dark` al `<html>` element
- El toggle esta en el Header
- Usa Tailwind CSS dark mode (`darkMode: "class"`)

---

## Arquitectura de URLs

Cada app tiene su propia URL en Railway:

- `https://{slug}-production.up.railway.app` (URL generada por Railway)
- En el futuro: `https://{slug}.interno.comunidadfeliz.cl` (custom domain)

La app define sus propias rutas internas:

- `/` — Pagina principal
- `/login` — Login (obligatorio)
- `/auth/callback` — Callback de Supabase (obligatorio)
- `/api/*` — API routes propias de la app
- Cualquier otra ruta que la app necesite

---

## hub.config.json: sidebar_nav

La seccion `sidebar_nav` en hub.config.json es **informativa** para el Hub. Define que items de navegacion tiene la app internamente:

```json
"sidebar_nav": [
  { "label": "Dashboard", "path": "/", "icon": "chart" },
  { "label": "Builder", "path": "/builder", "icon": "grid" }
]
```

El Hub muestra esta informacion en el detalle del proyecto, pero NO la usa para construir navegacion.

---

## Lo que cada app DEBE tener

- Header CF (56px) via `components/layout/Header.tsx`
- Rutas `/login` y `/auth/callback` (para auth con Supabase)
- Su propia navegacion interna si la necesita (Sidebar opcional)

## Lo que cada app NO debe tener

- Un header propio que duplique el header CF (logo, logout)
- Links al Hub en la navegacion (el header CF ya tiene el logo que linkea al Hub)
- Iframe de otras apps
