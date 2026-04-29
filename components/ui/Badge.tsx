type BadgeVariant = "healthy" | "unhealthy" | "unknown" | "info" | "warning";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  healthy:
    "bg-cf-green-light border border-cf-green-text/30 text-cf-green-text",
  unhealthy: "bg-cf-error-bg border border-cf-error/30 text-cf-error",
  unknown:
    "bg-cf-bg-gray dark:bg-cf-dark-border border border-cf-border dark:border-cf-dark-border text-cf-text-disabled",
  info: "bg-cf-blue-bg border border-cf-blue/30 text-cf-blue",
  warning: "bg-cf-warning-bg border border-cf-warning/30 text-cf-text-primary",
};

export default function Badge({
  variant,
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-3 py-1
        rounded text-xs font-semibold
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {(variant === "healthy" || variant === "unhealthy") && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === "healthy" ? "bg-cf-green-text" : "bg-cf-error"
          }`}
        />
      )}
      {children}
    </span>
  );
}
