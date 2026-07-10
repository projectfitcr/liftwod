import type { Language } from "@/lib/i18n";

const LOCALE: Record<Language, string> = { en: "en-GB", th: "th-TH" };

/** Gregorian years in both languages for v1 (Buddhist-era display deferred). */
export function formatDate(language: Language, iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(
    language === "th" ? "th-TH-u-ca-gregory" : LOCALE.en,
    { year: "numeric", month: "short", day: "numeric" }
  );
}

export function formatDateTime(language: Language, iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(
    language === "th" ? "th-TH-u-ca-gregory" : LOCALE.en,
    { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
  );
}

/** Session start times: 24h Bangkok wall clock ("17:30"). */
export function formatClockTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
}

export function formatNumber(language: Language, value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString(LOCALE[language]);
}

export function formatTHB(language: Language, value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString(LOCALE[language], {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}
