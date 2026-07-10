"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { ClassCard } from "@/components/schedule/ClassCard";
import type { DaySessions } from "@/lib/schedule/queries";
import { addDays, isoDow } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import type { LocaleKey } from "@/lib/i18n";

export function WeekSchedule({
  weekStart,
  today,
  days,
  currentWeekStart,
}: {
  weekStart: string;
  today: string;
  days: DaySessions[];
  currentWeekStart: string;
}) {
  const { t, language } = useLanguage();
  const byDate = new Map(days.map((d) => [d.date, d.sessions]));
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t("nav.schedule")}</h1>
        <div className="flex items-center gap-1.5 text-sm">
          <Link
            href={`/schedule?week=${addDays(weekStart, -7)}`}
            className="rounded-lg border border-hairline px-2.5 py-1 text-ink-secondary hover:bg-row-hover"
            aria-label="previous week"
          >
            ←
          </Link>
          {weekStart !== currentWeekStart ? (
            <Link
              href="/schedule"
              className="rounded-lg border border-hairline px-2.5 py-1 text-ink-secondary hover:bg-row-hover"
            >
              {t("schedule.thisWeek")}
            </Link>
          ) : null}
          <Link
            href={`/schedule?week=${addDays(weekStart, 7)}`}
            className="rounded-lg border border-hairline px-2.5 py-1 text-ink-secondary hover:bg-row-hover"
            aria-label="next week"
          >
            →
          </Link>
        </div>
      </div>

      <div className="space-y-5">
        {weekDates.map((date) => {
          const sessions = byDate.get(date) ?? [];
          const isToday = date === today;
          return (
            <section key={date}>
              <h2
                className={`mb-2 text-sm font-medium ${
                  isToday ? "text-primary" : "text-ink-secondary"
                }`}
              >
                {t(`day.${isoDow(date)}` as LocaleKey)} {formatDate(language, date)}
              </h2>
              {sessions.length === 0 ? (
                <p className="text-xs text-ink-tertiary">{t("schedule.noClasses")}</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <ClassCard key={s.id} session={s} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
