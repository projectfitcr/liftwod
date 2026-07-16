"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { ClassCard, type SessionView } from "@/components/schedule/ClassCard";
import { type WodView } from "@/components/wod/WodCard";
import {
  WodWithLogging,
  type MyResultsByComponent,
} from "@/components/wod/WodWithLogging";
import type { MembershipStatus } from "@/components/membership/helpers";
import { LeaderboardPreview } from "@/components/whiteboard/LeaderboardPreview";
import Link from "next/link";
import type { LocaleKey } from "@/lib/i18n";
import type { Board } from "@/lib/whiteboard/queries";

export function TodayView({
  name,
  sessions,
  membershipStatus,
  hasMembership,
  memberId,
  nowIso,
  today,
  myResults,
  wod,
  wodHidden,
  board,
  promotions,
}: {
  name: string;
  sessions: SessionView[];
  membershipStatus: MembershipStatus | null;
  hasMembership: boolean;
  memberId: string;
  nowIso: string;
  today: string;
  myResults: MyResultsByComponent;
  wod: WodView | null;
  wodHidden: boolean;
  board: Board | null;
  promotions: { id: string; sessionName: string }[];
}) {
  const { t } = useLanguage();
  const membershipProblem =
    !hasMembership || (membershipStatus && membershipStatus !== "active");
  const now = new Date(nowIso).getTime();
  const hasResults = Object.keys(myResults).length > 0;
  const primarySession =
    sessions.find((session) => session.checkedIn) ??
    sessions.find(
      (session) =>
        session.myBooking?.status === "booked" &&
        new Date(session.ends_at).getTime() >= now,
    ) ??
    sessions.find(
      (session) =>
        session.myBooking?.status === "waitlisted" &&
        new Date(session.starts_at).getTime() > now,
    ) ??
    sessions.find(
      (session) =>
        session.status === "scheduled" &&
        new Date(session.starts_at).getTime() > now,
    );
  const inCheckinWindow = primarySession
    ? now >= new Date(primarySession.starts_at).getTime() - 60 * 60 * 1000 &&
      now <= new Date(primarySession.ends_at).getTime()
    : false;
  const actionTitle = hasResults
    ? t("today.viewLeaderboard")
    : primarySession?.checkedIn
      ? t("today.recordResult")
      : primarySession?.myBooking?.status === "booked" && inCheckinWindow
        ? t("today.checkInReady")
        : primarySession?.myBooking?.status === "booked"
          ? t("today.bookingConfirmed")
          : primarySession?.myBooking?.status === "waitlisted"
            ? t("today.waitlistStatus")
            : t("today.reserveNext");
  const upcoming = primarySession
    ? sessions.filter((session) => session.id !== primarySession.id)
    : sessions;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-ink">
          {t("today.title")}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{actionTitle}</h1>
        {name ? <p className="text-sm text-ink-tertiary">{name}</p> : null}
      </div>

      <section aria-labelledby="next-action-title">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2
            id="next-action-title"
            className="text-sm font-semibold text-ink-secondary"
          >
            {t("today.nextAction")}
          </h2>
          {hasResults ? (
            <Link
              href={`/whiteboard?date=${today}`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-canvas hover:brightness-110"
            >
              {t("today.viewLeaderboard")}
            </Link>
          ) : primarySession?.checkedIn && wod ? (
            <a
              href="#today-workout"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-canvas hover:brightness-110"
            >
              {t("today.recordResult")}
            </a>
          ) : null}
        </div>
        {primarySession ? (
          <ClassCard session={primarySession} nowIso={nowIso} featured />
        ) : (
          <Card>
            <p className="text-sm text-ink-tertiary">{t("today.noClasses")}</p>
            <Link
              href="/schedule"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-ink hover:underline"
            >
              {t("nav.schedule")} →
            </Link>
          </Card>
        )}
      </section>

      {promotions.map((p) => (
        <p
          key={p.id}
          className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink"
        >
          🎉 {t("today.promoted", { name: p.sessionName })}
        </p>
      ))}

      {membershipProblem ? (
        <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning-ink">
          {t("today.membershipIssue", {
            status: membershipStatus
              ? t(`status.${membershipStatus}` as LocaleKey)
              : t("profile.noMembership"),
          })}
        </p>
      ) : null}

      {wod ? (
        <section id="today-workout" className="scroll-mt-20">
          <h2 className="mb-2 text-sm font-semibold text-ink-secondary">
            {t("today.workout")}
          </h2>
          <WodWithLogging
            wod={wod}
            hidden={wodHidden}
            date={today}
            canLog
            myResults={myResults}
          />
        </section>
      ) : null}

      {hasResults && board ? (
        <LeaderboardPreview board={board} memberId={memberId} date={today} />
      ) : null}

      {upcoming.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-secondary">
            {t("today.upcoming")}
          </h2>
          <div className="space-y-2">
            {upcoming.map((session) => (
              <ClassCard key={session.id} session={session} nowIso={nowIso} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
