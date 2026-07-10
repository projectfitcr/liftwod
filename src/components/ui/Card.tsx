export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-hairline bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}
