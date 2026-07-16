"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-primary text-canvas font-semibold hover:brightness-110 disabled:opacity-50",
  secondary:
    "border border-hairline bg-surface text-ink-primary hover:bg-row-hover disabled:opacity-50",
  danger:
    "bg-danger-soft text-danger-ink border border-danger/40 hover:brightness-110 disabled:opacity-50",
  ghost: "text-ink-secondary hover:text-ink-primary disabled:opacity-50",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
}) {
  const sizing =
    size === "sm"
      ? "min-h-10 px-3 py-1.5 text-xs"
      : "min-h-11 px-4 py-2 text-sm";
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg transition-colors disabled:cursor-not-allowed ${sizing} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
