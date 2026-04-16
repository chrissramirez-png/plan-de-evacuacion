"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar, { type SidebarLink } from "./Sidebar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface AppLayoutProps {
  children: React.ReactNode;
  profile: Profile | null;
  /** Links del sidebar. Si esta vacio o undefined, no se renderiza sidebar. */
  sidebarLinks?: SidebarLink[];
}

export default function AppLayout({
  children,
  profile,
  sidebarLinks = [],
}: AppLayoutProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasSidebar = sidebarLinks.length > 0;

  // Restore sidebar state
  useEffect(() => {
    if (!hasSidebar) return;
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setSidebarCollapsed(true);
  }, [hasSidebar]);

  const toggleSidebar = () => {
    if (!hasSidebar) return;
    if (window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem("sidebar-collapsed", String(next));
        return next;
      });
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-cf-bg-gray dark:bg-cf-dark-bg">
      <Header
        userEmail={profile?.email}
        userName={profile?.full_name || undefined}
        hubUrl={process.env.NEXT_PUBLIC_HUB_URL || undefined}
        sidebarCollapsed={hasSidebar ? sidebarCollapsed : undefined}
        onToggleSidebar={hasSidebar ? toggleSidebar : undefined}
        onSignOut={handleSignOut}
      />
      {hasSidebar && (
        <Sidebar
          links={sidebarLinks}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapse={() => {
            setSidebarCollapsed((prev) => {
              const next = !prev;
              localStorage.setItem("sidebar-collapsed", String(next));
              return next;
            });
          }}
          isAdmin={profile?.role === "admin"}
        />
      )}
      <main
        className={`
          pt-14 transition-all duration-200
          ${hasSidebar && sidebarCollapsed ? "md:pl-14" : ""}
          ${hasSidebar && !sidebarCollapsed ? "md:pl-60" : ""}
        `}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
