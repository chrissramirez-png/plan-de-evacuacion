"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_DOMAIN =
  process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || "comunidadfeliz.cl";

export default function AuthConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient();

      // Handle PKCE code exchange if present
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError || !data.session) {
          setError("No se pudo completar la autenticacion");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError("No se pudo completar la autenticacion");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // Verify domain
      const email = session.user.email || "";
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        await supabase.auth.signOut();
        router.push(`/login?error=Solo se permiten cuentas @${ALLOWED_DOMAIN}`);
        return;
      }

      // Create/update profile via API
      try {
        await fetch("/api/auth/profile", { method: "POST" });
      } catch {
        // Profile creation might fail but login still works
      }

      router.push("/dashboard");
    };

    handleAuth();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cf-bg-gray dark:bg-cf-dark-bg">
        <p className="text-cf-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cf-bg-gray dark:bg-cf-dark-bg">
      <p className="text-sm font-medium text-cf-text-secondary dark:text-cf-dark-text-secondary">
        Autenticando...
      </p>
    </div>
  );
}
