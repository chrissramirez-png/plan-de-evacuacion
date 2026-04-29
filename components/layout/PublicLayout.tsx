"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface PublicLayoutProps {
  children: React.ReactNode;
}

// Layout para paginas publicas.
// Patron de new-features: check no-bloqueante de sesion.
// - Con sesion: logo pequeño + link Catalogo, usuario + Salir
// - Sin sesion: logo CF grande + nombre app, nada mas
export default function PublicLayout({ children }: PublicLayoutProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Non-blocking session check — page renders immediately
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((result: any) => {
            if (result.data) setProfile(result.data as Profile);
          });
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-cf-bg-gray dark:bg-cf-dark-bg">
      <Header
        isPublic
        userEmail={profile?.email}
        userName={profile?.full_name || undefined}
        hubUrl={process.env.NEXT_PUBLIC_HUB_URL || undefined}
        onSignOut={profile ? handleSignOut : undefined}
      />
      <main className="pt-14">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
