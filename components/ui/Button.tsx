"use client";

import { type ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "destructive-outline"
  | "tertiary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "default" | "small";
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-cf-green text-cf-text-on-color hover:bg-cf-green-hover active:bg-cf-green-text disabled:bg-cf-border",
  secondary:
    "bg-cf-bg-white dark:bg-cf-dark-surface text-cf-text-primary dark:text-cf-dark-text border border-cf-border dark:border-cf-dark-border hover:bg-cf-bg-hover dark:hover:bg-cf-dark-border disabled:text-cf-border",
  destructive:
    "bg-cf-error text-cf-text-on-color hover:bg-cf-error-hover active:bg-cf-error-click disabled:bg-cf-border",
  "destructive-outline":
    "bg-transparent text-cf-error border border-cf-error hover:bg-cf-error-bg disabled:text-cf-border disabled:border-cf-border",
  tertiary:
    "bg-cf-blue-light text-cf-blue hover:bg-cf-blue-hover hover:text-cf-text-on-color disabled:bg-cf-border disabled:text-cf-text-on-color",
};

const sizeClasses = {
  default: "h-9 px-8 py-2 text-[14px] leading-[22px]",
  small: "h-7 px-4 py-1 text-[12px] leading-[16px]",
};

export default function Button({
  variant = "primary",
  size = "default",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-full font-semibold tracking-[0.5px]
        transition-colors disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
