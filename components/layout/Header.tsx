"use client";

import Image from "next/image";
import { useTheme } from "./ThemeProvider";

interface HeaderProps {
  appName?: string;
  userEmail?: string;
  userName?: string;
  hubUrl?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onSignOut?: () => void;
  /** True en paginas publicas — si no hay sesion, muestra solo logo grande + nombre app */
  isPublic?: boolean;
}

export default function Header({
  appName = "CAMBIAR: Nombre App",
  userEmail,
  userName,
  hubUrl,
  sidebarCollapsed = false,
  onToggleSidebar,
  onSignOut,
  isPublic = false,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  const isAuthenticated = !!(userName || userEmail);

  // Publico sin sesion: header minimo (logo grande + nombre app, nada mas)
  if (isPublic && !isAuthenticated) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-cf-bg-white dark:bg-cf-dark-bg border-b border-cf-bg-hover-alt dark:border-cf-dark-border shadow-[0_1px_5px_rgba(129,155,184,0.3)]">
        <div className="flex items-center gap-3">
          <a
            href={hubUrl || "#"}
            className="flex items-center gap-2 text-cf-brand-text-2 dark:text-cf-dark-text-secondary no-underline hover:text-cf-green transition-colors"
          >
            <Image
              src="/cf-logo-square.webp"
              alt="CF"
              width={24}
              height={24}
              style={{ width: 24, height: 24, borderRadius: 4 }}
            />
            <span className="text-[14px] font-medium">Catalogo</span>
          </a>
          <div className="w-px h-6 bg-cf-bg-hover-alt dark:bg-cf-dark-border" />
          <span className="text-[16px] leading-[24px] font-medium text-cf-text-secondary dark:text-cf-dark-text-secondary tracking-[0.15px]">
            {appName}
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-cf-bg-hover dark:hover:bg-cf-dark-border transition-colors"
          aria-label={
            theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }
        >
          {theme === "dark" ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-cf-dark-text-secondary"
            >
              <circle
                cx="10"
                cy="10"
                r="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-cf-brand-text-2"
            >
              <path
                d="M17.39 11.39A7.5 7.5 0 118.61 2.61a5.5 5.5 0 008.78 8.78z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </header>
    );
  }

  // Autenticado (publico o privado): header completo, mismo comportamiento
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-cf-bg-white dark:bg-cf-dark-bg border-b border-cf-bg-hover-alt dark:border-cf-dark-border shadow-[0_1px_5px_rgba(129,155,184,0.3)]">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded hover:bg-cf-bg-hover dark:hover:bg-cf-dark-border transition-colors"
          aria-label="Abrir menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="text-cf-brand-text-2 dark:text-cf-dark-text-secondary"
          >
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Logo + Catalogo link */}
        <a
          href={hubUrl || "#"}
          className="flex items-center gap-2 text-cf-brand-text-2 dark:text-cf-dark-text-secondary no-underline hover:text-cf-green transition-colors"
        >
          <Image
            src="/cf-logo-square.webp"
            alt="CF"
            width={24}
            height={24}
            style={{ width: 24, height: 24, borderRadius: 4 }}
          />
          <span className="hidden md:inline text-[14px] font-medium">
            Catalogo
          </span>
        </a>

        {/* App name divider */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-px h-6 bg-cf-bg-hover-alt dark:bg-cf-dark-border" />
          <span className="text-[16px] leading-[24px] font-medium text-cf-text-secondary dark:text-cf-dark-text-secondary tracking-[0.15px]">
            {appName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-cf-bg-hover dark:hover:bg-cf-dark-border transition-colors"
          aria-label={
            theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }
        >
          {theme === "dark" ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-cf-dark-text-secondary"
            >
              <circle
                cx="10"
                cy="10"
                r="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-cf-brand-text-2"
            >
              <path
                d="M17.39 11.39A7.5 7.5 0 118.61 2.61a5.5 5.5 0 008.78 8.78z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Divider */}
        {(userName || userEmail) && (
          <div className="w-px h-6 bg-cf-bg-hover-alt dark:bg-cf-dark-border" />
        )}

        {/* User info + avatar */}
        {(userName || userEmail) && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cf-green-light flex items-center justify-center">
              <span className="text-[12px] font-bold text-cf-green-text">
                {(userName || userEmail || "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-[14px] leading-[22px] font-medium text-cf-text-primary dark:text-cf-dark-text tracking-[0.25px] truncate max-w-36">
              {userName || userEmail}
            </span>
          </div>
        )}

        {/* Sign out */}
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="h-8 px-3 rounded text-[14px] leading-[22px] font-medium text-cf-text-secondary dark:text-cf-dark-text-secondary hover:text-cf-error hover:bg-cf-error-bg transition-colors tracking-[0.25px]"
          >
            Salir
          </button>
        )}
      </div>
    </header>
  );
}
