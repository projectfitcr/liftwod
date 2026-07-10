"use client";

import type { InputHTMLAttributes } from "react";

export function Field({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-ink-secondary">
        {label}
      </span>
      <input
        className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:shadow-[var(--focus-ring)]"
        {...props}
      />
      {hint ? (
        <span className="mt-1 block text-xs text-ink-tertiary">{hint}</span>
      ) : null}
    </label>
  );
}
