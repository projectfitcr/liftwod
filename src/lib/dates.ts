/**
 * Bangkok-wall-clock date-string helpers (yyyy-mm-dd). Pure string/UTC
 * arithmetic — no timezone surprises. Thailand has no DST.
 */

export function bangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing dateStr. */
export function weekStartOf(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return addDays(dateStr, -((dt.getUTCDay() + 6) % 7));
}

/** ISO day of week, 1=Mon … 7=Sun. */
export function isoDow(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1;
}
