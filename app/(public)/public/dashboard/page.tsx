"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isInternalUser } from "@/lib/auth-public";
import Card from "@/components/ui/Card";

/** Extract display name without exposing raw PII in the public page. */
function getDisplayInitial(meta: Record<string, unknown> | undefined): string {
  const name = (meta?.["display_name"] as string) || "";
  return name.charAt(0).toUpperCase() || "?";
}

export default function PublicDashboardPage() {
  const [displayInitial, setDisplayInitial] = useState("?");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/public/login";
        return;
      }

      // Redirect internal users — use identity data for domain check only
      const identities = session.user.identities || [];
      const identityEmail =
        (identities[0]?.identity_data?.["provider_email"] as string) || "";
      if (isInternalUser(identityEmail)) {
        window.location.href = "/dashboard";
        return;
      }

      setDisplayInitial(getDisplayInitial(session.user.user_metadata));
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/public/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cf-bg-gray dark:bg-cf-dark-bg">
        <div className="w-8 h-8 border-2 border-cf-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-[20px] leading-[24px] font-medium text-cf-text-primary dark:text-cf-dark-text tracking-[0.15px] mb-6">
        Bienvenido
      </h1>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cf-green-light flex items-center justify-center">
              <span className="text-[14px] font-bold text-cf-green-text">
                {displayInitial}
              </span>
            </div>
          </div>

          <div className="border-t border-cf-border dark:border-cf-dark-border pt-4">
            <p className="text-[14px] leading-[22px] text-cf-text-secondary dark:text-cf-dark-text-secondary tracking-[0.25px]">
              Esta es tu vista de acceso publico. Desde aqui puedes acceder a
              las funcionalidades disponibles para usuarios externos.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSignOut}
              className="h-8 px-4 rounded text-[14px] leading-[22px] font-medium text-cf-text-secondary dark:text-cf-dark-text-secondary hover:text-cf-error hover:bg-cf-error-bg transition-colors tracking-[0.25px]"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
