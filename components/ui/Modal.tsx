"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[598px] mx-4 bg-cf-bg-white dark:bg-cf-dark-surface border border-cf-border dark:border-cf-dark-border rounded-[5px] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cf-border dark:border-cf-dark-border">
          <h2 className="text-sm font-bold text-cf-text-primary dark:text-cf-dark-text">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-cf-bg-hover-alt dark:hover:bg-cf-dark-border transition-colors"
            aria-label="Cerrar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-cf-text-secondary dark:text-cf-dark-text-secondary"
            >
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 text-sm text-cf-text-secondary dark:text-cf-dark-text-secondary max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cf-border dark:border-cf-dark-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
