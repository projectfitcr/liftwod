"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { StaffClassCard } from "@/components/coach/StaffClassCard";
import type { DaySessions } from "@/lib/schedule/queries";
import { addDays, isoDow } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import type { LocaleKey } from "@/lib/i18n";

export function CoachClasses({
  weekStart,
  days,
}: {
  weekStart: string;
  days: DaySessions[];
}) {
  const { t, language } = useLanguage();
  const byDate = new Map(days.map((day) => [day.date, day.sessions]));
  const dates = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t("coach.classes.title")}</h1>
        <p className="mt-1 text-sm text-ink-tertiary">
          {t("coach.classes.subtitle")}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface px-3 py-2">
        <Link
          href={`/coach/classes?week=${addDays(weekStart, -7)}`}
          aria-label={t("common.previous")}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-row-hover"
        >
          ←
        </Link>
        <p className="text-center text-sm font-semibold">
          {t("schedule.weekOf", { date: formatDate(language, weekStart) })}
        </p>
        <Link
          href={`/coach/classes?week=${addDays(weekStart, 7)}`}
          aria-label={t("common.next")}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-row-hover"
        >
          →
        </Link>
      </div>

      {dates.map((date) => {
        const sessions = byDate.get(date) ?? [];
        return (
          <section key={date}>
            <h2 className="mb-2 text-sm font-semibold text-ink-secondary">
              {t(`day.${isoDow(date)}` as LocaleKey)} ·{" "}
              {formatDate(language, date)}
            </h2>
            {sessions.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {sessions.map((session) => (
                  <StaffClassCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <p className="py-3 text-sm text-ink-tertiary">
                {t("schedule.noClasses")}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
