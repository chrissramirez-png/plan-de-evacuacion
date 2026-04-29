"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// --- Tipos ---
export interface SidebarLink {
  href: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

export interface SidebarProps {
  links: SidebarLink[];
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  isAdmin?: boolean;
}

// --- Estilos ---
// Sidebar: fondo oscuro (--color-cf-sidebar), ancho 240px expandido / 56px colapsado
// Links: 40px alto, rounded-md, texto blanco 80% opacity, activo verde CF
// Mobile: overlay negro 40% + drawer desde la izquierda

export default function Sidebar({
  links,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
  isAdmin = false,
}: SidebarProps) {
  const pathname = usePathname();

  const visibleLinks = links.filter((link) => !link.adminOnly || isAdmin);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  if (visibleLinks.length === 0) return null;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed top-14 left-0 bottom-0 z-40 flex flex-col
          bg-cf-sidebar
          border-r border-cf-sidebar dark:border-cf-dark-border
          transition-all duration-200
          ${collapsed ? "w-14" : "w-60"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Navigation */}
        <nav className="flex-1 py-3 px-2">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onCloseMobile}
              className={`
                flex items-center gap-3 px-3 h-10 rounded-md
                text-[14px] leading-[22px] font-medium tracking-[0.25px] mb-1
                transition-colors
                ${
                  isActive(link.href)
                    ? "bg-cf-sidebar-active text-white"
                    : "text-white/80 hover:text-white hover:bg-cf-sidebar-hover"
                }
              `}
              title={collapsed ? link.label : undefined}
            >
              <span
                className={`shrink-0 ${isActive(link.href) ? "text-white" : ""}`}
              >
                {link.icon}
              </span>
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center h-10 mx-2 mb-2 rounded-md text-white/80 hover:text-white hover:bg-cf-sidebar-hover transition-colors"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          >
            <path
              d="M12 4l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </aside>
    </>
  );
}
