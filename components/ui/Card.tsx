interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
        bg-cf-bg-white dark:bg-cf-dark-surface
        border border-cf-border dark:border-cf-dark-border
        rounded-lg p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}
