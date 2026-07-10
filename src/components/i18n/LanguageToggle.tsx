"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center rounded-full border border-hairline bg-surface p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => setLanguage("th")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          language === "th"
            ? "bg-primary-soft text-primary-ink"
            : "text-ink-tertiary hover:text-ink-secondary"
        }`}
      >
        ไทย
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          language === "en"
            ? "bg-primary-soft text-primary-ink"
            : "text-ink-tertiary hover:text-ink-secondary"
        }`}
      >
        EN
      </button>
    </div>
  );
}
