const ALLOWED_DOMAIN =
  process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || "comunidadfeliz.cl";

/**
 * Determina si un email pertenece al dominio interno (@comunidadfeliz.cl).
 * Usuarios internos acceden a /dashboard, externos a rutas publicas.
 */
export function isInternalUser(email: string): boolean {
  return email.endsWith(`@${ALLOWED_DOMAIN}`);
}

/**
 * Retorna la ruta por defecto para usuarios externos.
 * Lee publicRoutes de hub.config si esta disponible, o usa /public.
 */
export function getPublicRedirect(): string {
  return "/public/dashboard";
}
