import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Rutas siempre publicas (no requieren auth)
const ALWAYS_PUBLIC = ["/login", "/auth/callback", "/auth/confirm"];

// CAMBIAR: Agrega aqui las rutas publicas de tu app
// Estas rutas son accesibles sin login (landing pages, vistas publicas, etc.)
const PUBLIC_ROUTES = [
  "/public", // Paginas bajo app/(public)/
  "/docs", // Documentacion publica
  // "/otra-ruta-publica",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for always-public routes, static files, and ALL API routes
  // API routes validate auth internally (session is in localStorage, not cookies)
  if (
    ALWAYS_PUBLIC.some((route) => pathname.startsWith(route)) ||
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.match(/\.(svg|webp|ico|png|jpg|js|css)$/)
  ) {
    return NextResponse.next();
  }

  // Pages: refresh cookies but don't block (client-side auth)
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
