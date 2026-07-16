"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label={language === "th" ? "ภาษา" : "Language"}
      className="flex items-center rounded-full border border-hairline bg-surface p-0.5 text-xs font-medium"
    >
      <button
        type="button"
        aria-pressed={language === "th"}
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
        aria-pressed={language === "en"}
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
