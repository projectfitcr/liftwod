"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { ClassCard, type SessionView } from "@/components/schedule/ClassCard";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { addDays, isoDow } from "@/lib/dates";
import { formatClockTime, formatDate } from "@/lib/format";
import type { LocaleKey } from "@/lib/i18n";
import type { DaySessions } from "@/lib/schedule/queries";

type ViewMode = "list" | "calendar";

const VIEW_STORAGE_KEY = "liftwod.schedule.view";
const VIEW_CHANGE_EVENT = "liftwod-schedule-view-change";

function subscribeToViewPreference(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(VIEW_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(VIEW_CHANGE_EVENT, onStoreChange);
  };
}

export function ScheduleView({
  userId,
  startDate,
  today,
  days,
  isStaff,
  nowIso,
}: {
  userId: string;
  startDate: string;
  today: string;
  days: DaySessions[];
  isStaff: boolean;
  nowIso: string;
}) {
  const { t, language } = useLanguage();
  const storageKey = `${VIEW_STORAGE_KEY}.${userId}`;
  const getViewPreference = useCallback(
    (): ViewMode =>
      window.localStorage.getItem(storageKey) === "list" ? "list" : "calendar",
    [storageKey],
  );
  const view = useSyncExternalStore(
    subscribeToViewPreference,
    getViewPreference,
    () => "calendar",
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const byDate = new Map(days.map((day) => [day.date, day.sessions]));
  const dates = Array.from({ length: 14 }, (_, index) => addDays(startDate, index));
  const allSessions = dates.flatMap((date) => byDate.get(date) ?? []);
  const selectedSession = selectedSessionId
    ? allSessions.find((session) => session.id === selectedSessionId) ?? null
    : null;

  function chooseView(nextView: ViewMode) {
    window.localStorage.setItem(storageKey, nextView);
    window.dispatchEvent(new Event(VIEW_CHANGE_EVENT));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("schedule.upcoming")}</h1>
          <p className="mt-0.5 text-sm text-ink-tertiary">
            {formatDate(language, startDate)} – {formatDate(language, addDays(startDate, 13))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex rounded-lg border border-hairline bg-surface p-1"
            aria-label={t("schedule.viewLabel")}
          >
            {(["list", "calendar"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={view === mode}
                onClick={() => chooseView(mode)}
                className={`min-h-10 rounded-md px-3 text-xs font-semibold transition-colors ${
                  view === mode
                    ? "bg-primary-soft text-primary-ink"
                    : "text-ink-tertiary hover:text-ink-primary"
                }`}
              >
                {mode === "list" ? t("schedule.listView") : t("schedule.calendarView")}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Link
              href={`/schedule?start=${addDays(startDate, -14)}`}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline text-ink-secondary hover:bg-row-hover"
              aria-label={t("common.previous")}
            >
              ←
            </Link>
            {startDate !== today ? (
              <Link
                href="/schedule"
                className="flex min-h-11 items-center rounded-lg border border-hairline px-3 text-xs font-semibold text-ink-secondary hover:bg-row-hover"
              >
                {t("schedule.today")}
              </Link>
            ) : null}
            <Link
              href={`/schedule?start=${addDays(startDate, 14)}`}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline text-ink-secondary hover:bg-row-hover"
              aria-label={t("common.next")}
            >
              →
            </Link>
          </div>
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-5">
          {dates.map((date) => {
            const sessions = byDate.get(date) ?? [];
            return (
              <ScheduleDayHeading key={date} date={date} today={today}>
                {sessions.length === 0 ? (
                  <p className="text-xs text-ink-tertiary">{t("schedule.noClasses")}</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <ClassCard
                        key={session.id}
                        session={session}
                        staffLink={isStaff}
                        nowIso={nowIso}
                      />
                    ))}
                  </div>
                )}
              </ScheduleDayHeading>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {dates.map((date) => (
              <CalendarDay
                key={date}
                date={date}
                today={today}
                sessions={byDate.get(date) ?? []}
                selectedSessionId={selectedSession?.id ?? null}
                onSelect={setSelectedSessionId}
              />
            ))}
          </div>

          {allSessions.length === 0 ? (
            <p className="rounded-xl border border-hairline bg-surface p-4 text-sm text-ink-tertiary">
              {t("schedule.noClassesInRange")}
            </p>
          ) : null}

          <Dialog
            open={selectedSession !== null}
            onClose={() => setSelectedSessionId(null)}
            labelledBy="selected-session-title"
          >
            {selectedSession ? (
              <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] sm:h-auto">
                <div className="flex items-start justify-between gap-3 border-b border-hairline bg-surface px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:rounded-t-2xl sm:pt-3">
                  <div>
                    <h2 id="selected-session-title" className="text-lg font-semibold">
                      {t("schedule.selectedSession")}
                    </h2>
                    <p className="mt-0.5 text-xs text-ink-tertiary">
                      {formatDate(language, selectedSession.starts_at)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSessionId(null)}
                  >
                    {t("common.close")}
                  </Button>
                </div>
                <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <ClassCard
                    key={selectedSession.id}
                    session={selectedSession}
                    staffLink={isStaff}
                    nowIso={nowIso}
                    featured
                  />
                </div>
              </div>
            ) : null}
          </Dialog>
        </div>
      )}
    </div>
  );
}

function ScheduleDayHeading({
  date,
  today,
  children,
}: {
  date: string;
  today: string;
  children: React.ReactNode;
}) {
  const { t, language } = useLanguage();

  return (
    <section>
      <h2
        className={`mb-2 text-sm font-medium ${
          date === today ? "text-primary-ink" : "text-ink-secondary"
        }`}
      >
        {t(`day.${isoDow(date)}` as LocaleKey)} {formatDate(language, date)}
        {date === today ? ` · ${t("schedule.today")}` : ""}
      </h2>
      {children}
    </section>
  );
}

function CalendarDay({
  date,
  today,
  sessions,
  selectedSessionId,
  onSelect,
}: {
  date: string;
  today: string;
  sessions: SessionView[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
}) {
  const { t, language } = useLanguage();
  const isToday = date === today;

  return (
    <section
      className={`min-h-36 rounded-xl border p-2 ${
        isToday ? "border-primary/60 bg-primary-soft/30" : "border-hairline bg-surface"
      }`}
    >
      <div className="mb-2 border-b border-hairline pb-1.5">
        <p className={`text-xs font-semibold ${isToday ? "text-primary-ink" : "text-ink-secondary"}`}>
          {t(`day.${isoDow(date)}` as LocaleKey)}
        </p>
        <p className="text-[11px] text-ink-tertiary">{formatDate(language, date)}</p>
      </div>
      {sessions.length === 0 ? (
        <p className="text-[11px] text-ink-tertiary">{t("schedule.noClasses")}</p>
      ) : (
        <div className="space-y-1.5">
          {sessions.map((session) => {
            const selected = session.id === selectedSessionId;
            const booked = session.myBooking?.status === "booked";
            const waitlisted = session.myBooking?.status === "waitlisted";
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelect(session.id)}
                className={`w-full rounded-lg border px-2 py-2 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary-soft text-primary-ink"
                    : "border-hairline bg-surface-raised hover:border-primary/50"
                } ${session.status === "cancelled" ? "opacity-60" : ""}`}
              >
                <span className="block text-xs font-semibold tabular-nums">
                  {formatClockTime(session.starts_at)}
                </span>
                <span className="mt-0.5 block break-words text-[11px] leading-tight">
                  {session.name}
                </span>
                <span className="mt-1 block text-[10px] text-ink-tertiary">
                  {session.status === "cancelled"
                    ? t("schedule.cancelledSession")
                    : booked
                      ? t("booking.bookedPill")
                      : waitlisted
                        ? t("booking.waitlistedPill")
                        : t("schedule.spots", {
                            booked: session.booked,
                            capacity: session.capacity,
                          })}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
