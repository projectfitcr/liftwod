import en from "@/locales/en.json";
import th from "@/locales/th.json";

export type Language = "en" | "th";

/**
 * Typed keys: t("some.typo") is a COMPILE error (oxcart pattern).
 */
export type LocaleKey = keyof typeof en;

// Compile-time parity check: th.json must define every key en.json has.
// A missing Thai string fails `tsc`, not a runtime fallback.
const thChecked: Record<LocaleKey, string> = th;

const locales: Record<Language, Record<LocaleKey, string>> = {
  en,
  th: thChecked,
};

export function translate(
  language: Language,
  key: LocaleKey,
  params?: Record<string, string | number>
): string {
  let text = locales[language][key] ?? locales.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "th";
}

/** Bilingual DB content (exercises etc.): prefer the user's language, fall
 *  back to the other, em-dash if neither. */
export function localizedName(
  language: Language,
  row: { name_en: string | null; name_th: string | null }
): string {
  const preferred = language === "th" ? row.name_th : row.name_en;
  return preferred || row.name_en || row.name_th || "—";
}
