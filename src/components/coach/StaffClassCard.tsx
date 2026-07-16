"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Pill } from "@/components/ui/Pill";
import { formatClockTime } from "@/lib/format";
import type { SessionView } from "@/components/schedule/ClassCard";

export function StaffClassCard({ session }: { session: SessionView }) {
  const { t } = useLanguage();
  const cancelled = session.status === "cancelled";

  return (
    <Link
      href={`/coach/class/${session.id}`}
      className={`group block rounded-xl border border-hairline bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40 hover:bg-row-hover ${
        cancelled ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="text-lg font-bold tabular-nums text-primary-ink">
            {formatClockTime(session.starts_at)}
          </span>
          <div className="min-w-0">
            <p className="break-words font-semibold">{session.name}</p>
            <p className="mt-0.5 text-sm text-ink-tertiary">
              {session.coachName
                ? t("schedule.coachPrefix", { name: session.coachName })
                : t("admin.schedule.noCoach")}
            </p>
          </div>
        </div>
        {cancelled ? (
          <Pill tone="danger">{t("schedule.cancelledSession")}</Pill>
        ) : (
          <span className="text-right">
            <span className="block text-sm font-semibold tabular-nums">
              {t("schedule.spots", {
                booked: session.booked,
                capacity: session.capacity,
              })}
            </span>
            {session.waiting > 0 ? (
              <span className="text-xs text-warning-ink">
                {t("schedule.waiting", { count: session.waiting })}
              </span>
            ) : null}
          </span>
        )}
      </div>
      {!cancelled ? (
        <span className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-ink group-hover:underline">
          {t("coach.class.open")} →
        </span>
      ) : null}
    </Link>
  );
}
