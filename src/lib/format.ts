import type { Language } from "@/lib/i18n";

const LOCALE: Record<Language, string> = { en: "en-GB", th: "th-TH" };
const POUNDS_PER_KILOGRAM = 2.2046226218;

/** The database keeps loads in kilograms; the member-facing app uses pounds. */
export function kilogramsToPounds(kilograms: number): number {
  return kilograms * POUNDS_PER_KILOGRAM;
}

/** Round persisted conversions enough to avoid floating-point noise. */
export function poundsToKilograms(pounds: number): number {
  return Math.round((pounds / POUNDS_PER_KILOGRAM) * 1000) / 1000;
}

export function loadInputValue(kilograms: number): string {
  return String(Math.round(kilogramsToPounds(kilograms) * 100) / 100);
}

export function formatLoadPounds(language: Language, kilograms: number): string {
  return `${kilogramsToPounds(kilograms).toLocaleString(LOCALE[language], {
    maximumFractionDigits: 1,
  })} lb`;
}

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

/** "3:45" from 225 seconds. */
export function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Score rendering per score type: 3:45 · 5+12 · 176.4 lb · 42 · 1,000 m · 50 cal. */
export function formatScore(
  language: Language,
  scoreType: string,
  r: {
    time_seconds: number | null;
    rounds: number | null;
    reps: number | null;
    load_kg: number | null;
    distance_m: number | null;
    calories: number | null;
  }
): string {
  switch (scoreType) {
    case "time":
      return r.time_seconds != null ? formatMMSS(r.time_seconds) : "—";
    case "rounds_reps":
      return r.rounds != null ? `${r.rounds}+${r.reps ?? 0}` : "—";
    case "load":
      return r.load_kg != null
        ? formatLoadPounds(language, Number(r.load_kg))
        : "—";
    case "reps":
      return r.reps != null ? formatNumber(language, r.reps) : "—";
    case "distance":
      return r.distance_m != null ? `${formatNumber(language, Number(r.distance_m))} m` : "—";
    case "calories":
      return r.calories != null ? `${formatNumber(language, r.calories)} cal` : "—";
    default:
      return "—";
  }
}
