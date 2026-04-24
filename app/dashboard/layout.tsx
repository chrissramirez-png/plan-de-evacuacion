"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ThemeProvider from "@/components/layout/ThemeProvider";
import AppLayout from "@/components/layout/AppLayout";
import type { Profile } from "@/lib/types";
import type { SidebarLink } from "@/components/layout/Sidebar";

// Sidebar del Plan de Evacuación
// Si el array esta vacio, no se muestra sidebar y el contenido ocupa todo el ancho.
//
// Ejemplo:
// const sidebarLinks: SidebarLink[] = [
//   {
//     href: "/dashboard",
//     label: "Inicio",
//     icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 9l7-6 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 8v7a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
//   },
//   {
//     href: "/dashboard/settings",
//     label: "Configuracion",
//     adminOnly: true,
//     icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" /><path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
//   },
// ];
const sidebarLinks: SidebarLink[] = [];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/login";
        return;
      }

      // Fire-and-forget: update profile + send access log to Hub
      fetch("/api/auth/profile", { method: "POST" }).catch(() => {});

      // Fetch profile direct from Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((result: any) => {
          if (result.data) {
            setProfile(result.data as Profile);
          }
          setLoading(false);
        });
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cf-bg-gray">
        <div className="w-6 h-6 border-2 border-cf-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AppLayout profile={profile} sidebarLinks={sidebarLinks}>
        {children}
      </AppLayout>
    </ThemeProvider>
  );
}
