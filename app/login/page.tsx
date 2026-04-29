"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setError(urlError);

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = "/dashboard";
      } else {
        setChecking(false);
      }
    });
  }, [searchParams]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      setError(error?.message || "No se pudo iniciar sesión");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cf-bg-gray dark:bg-cf-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-cf-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-cf-text-secondary dark:text-cf-dark-text-secondary tracking-[0.25px]">
            Verificando sesion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cf-bg-gray dark:bg-cf-dark-bg px-4">
      <div className="w-full max-w-[400px] bg-cf-bg-white dark:bg-cf-dark-surface rounded-lg border border-cf-border dark:border-cf-dark-border overflow-hidden">
        {/* Green accent top bar */}
        <div className="h-1 bg-cf-green" />

        <div className="p-8 flex flex-col items-center gap-8">
          {/* Logo + title */}
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/cf-logo-name.svg"
              alt="ComunidadFeliz"
              width={180}
              height={21}
              priority
              style={{ width: "auto", height: "auto" }}
            />
            <div className="text-center">
              <h1 className="text-[20px] leading-[24px] font-medium text-cf-text-primary dark:text-cf-dark-text tracking-[0.15px]">
                Plan de Evacuación Interactivo
              </h1>
              <p className="mt-2 text-[14px] leading-[22px] font-medium text-cf-text-secondary dark:text-cf-dark-text-secondary tracking-[0.25px]">
                Herramienta de evacuación con IA para edificios
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="w-full rounded border border-cf-error bg-cf-error-bg px-4 py-3 text-[12px] leading-[16px] font-medium text-cf-error tracking-[0.4px]">
              {error}
            </div>
          )}

          {/* Login button */}
          <div className="w-full flex flex-col items-center gap-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-10 rounded bg-cf-green text-cf-text-on-color font-semibold text-[14px] leading-[22px] tracking-[0.5px] hover:bg-cf-green-hover active:bg-cf-green-text disabled:bg-cf-border disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                      fill="#4285F4"
                    />
                    <path
                      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                      fill="#34A853"
                    />
                    <path
                      d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                      fill="#EA4335"
                    />
                  </svg>
                  Iniciar sesion con Google
                </>
              )}
            </button>

            <p className="text-[12px] leading-[16px] font-medium text-cf-text-disabled dark:text-cf-dark-text-secondary tracking-[0.4px]">
              Solo cuentas @
              {process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || "comunidadfeliz.cl"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cf-bg-gray">
          <div className="w-8 h-8 border-2 border-cf-green border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
