type Tone = "primary" | "accent" | "success" | "info" | "warning" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-ink",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success-ink",
  info: "bg-info-soft text-info-ink",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger-ink",
  neutral: "bg-surface-raised text-ink-secondary",
};

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
