const SIZES = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
} as const;

/** Face-or-initial circle. `name` drives the fallback initial and alt text. */
export function Avatar({
  url,
  name,
  size = "sm",
}: {
  url: string | null | undefined;
  name: string;
  size?: keyof typeof SIZES;
}) {
  const cls = `${SIZES[size]} shrink-0 rounded-full object-cover bg-surface-raised`;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- tiny avatar, remote supabase URL
    return <img src={url} alt={name} className={cls} />;
  }
  return (
    <span
      aria-hidden
      className={`${cls} flex items-center justify-center font-semibold text-ink-tertiary`}
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
