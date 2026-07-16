"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { formatClockTime, formatDate } from "@/lib/format";
import {
  bookClass,
  cancelBooking,
  type BookingResult,
} from "@/lib/bookings/actions";
import { checkIn } from "@/lib/attendance/actions";
import type { Language, LocaleKey } from "@/lib/i18n";

export type SessionView = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "cancelled";
  coachName: string | null;
  capacity: number;
  booked: number;
  waiting: number;
  myBooking: { id: string; status: "booked" | "waitlisted" } | null;
  checkedIn: boolean;
};

export function bookingMessage(
  t: (key: LocaleKey, params?: Record<string, string | number>) => string,
  language: Language,
  res: BookingResult,
): string {
  const meta = (res.meta ?? {}) as Record<string, string | number>;
  return t(`booking.code.${res.code}` as LocaleKey, {
    position: meta.position ?? "",
    limit: meta.limit ?? "",
    days: meta.window_days ?? "",
    date: meta.resets_on ? formatDate(language, String(meta.resets_on)) : "",
  });
}

export function ClassCard({
  session,
  staffLink = false,
  nowIso,
  featured = false,
}: {
  session: SessionView;
  staffLink?: boolean;
  nowIso: string;
  featured?: boolean;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    text: string;
    ok: boolean;
    visitsLeft?: number;
  } | null>(null);

  const [now, setNow] = useState(() => new Date(nowIso).getTime());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const past = new Date(session.starts_at).getTime() <= now;
  const cancelled = session.status === "cancelled";
  const full = session.booked >= session.capacity;
  // Self check-in window mirrors the RPC gate: 60 min before start → end.
  const inCheckinWindow =
    now >= new Date(session.starts_at).getTime() - 60 * 60 * 1000 &&
    now <= new Date(session.ends_at).getTime();

  function run(action: () => Promise<BookingResult>) {
    startTransition(async () => {
      const res = await action();
      const visits = (res.meta as { visits_remaining?: number } | undefined)
        ?.visits_remaining;
      setMessage({
        text: bookingMessage(t, language, res),
        ok: res.ok,
        visitsLeft: typeof visits === "number" ? visits : undefined,
      });
      router.refresh();
    });
  }

  return (
    <div
      className={`rounded-xl border bg-surface p-4 shadow-[var(--shadow-card)] ${
        featured ? "border-primary/50" : "border-hairline"
      } ${cancelled || past ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="whitespace-nowrap text-base font-semibold tabular-nums">
            {formatClockTime(session.starts_at)}
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-medium">{session.name}</p>
            <p className="break-words text-xs text-ink-tertiary">
              {session.coachName
                ? t("schedule.coachPrefix", { name: session.coachName })
                : null}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {cancelled ? (
            <Pill tone="danger">{t("schedule.cancelledSession")}</Pill>
          ) : (
            <>
              <span
                className={`whitespace-nowrap text-xs tabular-nums ${
                  full ? "text-warning-ink" : "text-ink-tertiary"
                }`}
              >
                {t("schedule.spots", {
                  booked: session.booked,
                  capacity: session.capacity,
                })}
                {session.waiting > 0
                  ? ` · ${t("schedule.waiting", { count: session.waiting })}`
                  : ""}
              </span>

              {session.checkedIn ? (
                <Pill tone="success">{t("checkin.done")}</Pill>
              ) : inCheckinWindow ? (
                <Button
                  variant="primary"
                  disabled={pending}
                  onClick={() => run(() => checkIn(session.id))}
                >
                  {t("checkin.self")}
                </Button>
              ) : null}

              {!session.checkedIn && session.myBooking ? (
                <>
                  <Pill
                    tone={
                      session.myBooking.status === "booked" ? "success" : "info"
                    }
                  >
                    {session.myBooking.status === "booked"
                      ? t("booking.bookedPill")
                      : t("booking.waitlistedPill")}
                  </Pill>
                  {!past ? (
                    <Button
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        run(() => cancelBooking(session.myBooking!.id))
                      }
                    >
                      {t("booking.cancel")}
                    </Button>
                  ) : null}
                </>
              ) : !session.checkedIn && !session.myBooking && !past ? (
                <Button
                  variant={full ? "secondary" : "primary"}
                  disabled={pending}
                  onClick={() => run(() => bookClass(session.id))}
                >
                  {full ? t("booking.joinWaitlist") : t("booking.book")}
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {message ? (
        <p
          className={`mt-2 rounded-lg px-3 py-2 text-xs ${
            message.ok
              ? "bg-success-soft text-success-ink"
              : "bg-warning-soft text-warning-ink"
          }`}
        >
          {message.text}
          {message.ok && typeof message.visitsLeft === "number"
            ? ` ${t("checkin.visitsLeft", { count: message.visitsLeft })}`
            : ""}
        </p>
      ) : null}

      {staffLink && !cancelled ? (
        <Link
          href={`/coach/class/${session.id}`}
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary-ink hover:underline"
        >
          {t("coach.runClass")}
        </Link>
      ) : null}
    </div>
  );
}
