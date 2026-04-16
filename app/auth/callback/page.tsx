"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isInternalUser, getPublicRedirect } from "@/lib/auth-public";

const ALLOWED_DOMAIN =
  process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || "comunidadfeliz.cl";

function verifyAndRedirect(
  supabase: ReturnType<typeof createClient>,
  email: string
) {
  // Determinar si el flujo viene de login publico
  const url = new URL(window.location.href);
  const flowParam = url.searchParams.get("flow");
  const storedFlow = sessionStorage.getItem("auth_flow");
  const isPublicFlow = flowParam === "public" || storedFlow === "public";

  // Limpiar sessionStorage
  sessionStorage.removeItem("auth_flow");

  if (isInternalUser(email)) {
    // Usuario interno: crear/actualizar perfil y redirigir a dashboard
    fetch("/api/auth/profile", { method: "POST" }).catch(() => {});
    window.location.href = "/dashboard";
    return;
  }

  // Usuario externo
  if (isPublicFlow) {
    // Flujo publico: permitir acceso a rutas publicas
    window.location.href = getPublicRedirect();
    return;
  }

  // Usuario externo intentando login interno: cerrar sesion y mostrar error
  supabase.auth.signOut().then(() => {
    window.location.href = `/login?error=Solo se permiten cuentas @${ALLOWED_DOMAIN}`;
  });
}

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Autenticando...");

  useEffect(() => {
    const supabase = createClient();

    // PKCE flow: Supabase returns ?code= as query param
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) {
          const isPublic =
            url.searchParams.get("flow") === "public" ||
            sessionStorage.getItem("auth_flow") === "public";
          const loginPath = isPublic ? "/public/login" : "/login";
          window.location.href = `${loginPath}?error=${encodeURIComponent(error?.message || "No se pudo completar la autenticacion")}`;
          return;
        }
        setStatus("Sesion iniciada. Redirigiendo...");
        verifyAndRedirect(supabase, data.session.user.email || "");
      });
      return;
    }

    // Implicit flow fallback: tokens come in URL hash
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("Sesion iniciada. Redirigiendo...");
        verifyAndRedirect(supabase, session.user.email || "");
      }
    });

    // Fallback: if nothing fires after 10 seconds, check session
    const timeout = setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        verifyAndRedirect(supabase, session.user.email || "");
      } else {
        window.location.href =
          "/login?error=No se pudo completar la autenticacion";
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cf-bg-gray dark:bg-cf-dark-bg">
      <p className="text-sm font-medium text-cf-text-secondary dark:text-cf-dark-text-secondary">
        {status}
      </p>
    </div>
  );
}
