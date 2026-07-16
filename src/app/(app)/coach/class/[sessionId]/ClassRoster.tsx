"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatClockTime, formatDate } from "@/lib/format";
import { checkIn, undoCheckIn } from "@/lib/attendance/actions";
import { Avatar } from "@/components/ui/Avatar";
import { bookingMessage } from "@/components/schedule/ClassCard";
import {
  ScoreDrawer,
  type ExistingScore,
} from "@/components/results/ScoreDrawer";
import type { BookingResult } from "@/lib/bookings/actions";
import type { LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";
import { WodCard, type WodView } from "@/components/wod/WodCard";
import { WhiteboardBoard } from "@/components/whiteboard/WhiteboardBoard";
import type { Board } from "@/lib/whiteboard/queries";

type ScoreType = Database["public"]["Enums"]["score_type"];
type ComponentKind = Database["public"]["Enums"]["component_kind"];

type RosterRow = {
  bookingId: string;
  memberId: string;
  name: string;
  avatarUrl: string | null;
  status: "booked" | "waitlisted";
  attendanceId: string | null;
};

type DayResult = ExistingScore & {
  component_id: string;
  member_id: string;
  is_pr: boolean;
};

export function ClassRoster({
  session,
  roster,
  walkIns,
  addable,
  scorableComponents,
  dayResults,
  wod,
  board,
}: {
  session: {
    id: string;
    name: string;
    date: string;
    startsAt: string;
    status: "scheduled" | "cancelled";
    capacity: number;
  };
  roster: RosterRow[];
  walkIns: {
    memberId: string;
    name: string;
    avatarUrl: string | null;
    attendanceId: string;
  }[];
  addable: { id: string; name: string }[];
  scorableComponents: {
    id: string;
    scoreType: ScoreType;
    kind: ComponentKind;
    title: string | null;
  }[];
  dayResults: DayResult[];
  wod: WodView | null;
  board: Board | null;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [walkInId, setWalkInId] = useState("");
  const [scoring, setScoring] = useState<{
    memberId: string;
    name: string;
  } | null>(null);
  const [view, setView] = useState<"roster" | "workout" | "board">("roster");

  const drawerComponents = scorableComponents.map((c) => ({
    id: c.id,
    scoreType: c.scoreType,
    label: `${t(`kind.${c.kind}` as LocaleKey)}${c.title ? ` · ${c.title}` : ""}`,
  }));

  function existingFor(
    memberId: string,
  ): Partial<Record<string, ExistingScore>> {
    const map: Partial<Record<string, ExistingScore>> = {};
    for (const r of dayResults.filter((r) => r.member_id === memberId)) {
      map[r.component_id] = r;
    }
    return map;
  }

  function scoreCount(memberId: string): number {
    return dayResults.filter((r) => r.member_id === memberId).length;
  }

  function run(action: () => Promise<BookingResult>) {
    startTransition(async () => {
      const res = await action();
      setMessage(res.ok ? null : bookingMessage(t, language, res));
      router.refresh();
    });
  }

  const booked = roster.filter((r) => r.status === "booked");
  const waitlisted = roster.filter((r) => r.status === "waitlisted");
  const checkedInCount =
    booked.filter((row) => row.attendanceId).length + walkIns.length;
  const tabs = [
    ["roster", "coach.class.roster"],
    ["workout", "coach.class.workout"],
    ["board", "coach.class.board"],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-surface p-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-ink">
          {formatDate(language, session.date)} ·{" "}
          {formatClockTime(session.startsAt)}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{session.name}</h1>
        <p className="mt-1 text-sm text-ink-tertiary">
          {t("coach.class.checkedInCount", { count: checkedInCount })} ·{" "}
          {t("schedule.spots", {
            booked: booked.length,
            capacity: session.capacity,
          })}
        </p>
        {session.status === "cancelled" ? (
          <span className="mt-2 inline-flex">
            <Pill tone="danger">{t("schedule.cancelledSession")}</Pill>
          </span>
        ) : null}
      </div>

      <div
        role="tablist"
        aria-label={session.name}
        className="sticky top-16 z-10 grid grid-cols-3 rounded-xl border border-hairline bg-surface/95 p-1 backdrop-blur"
      >
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors ${
              view === id
                ? "bg-primary-soft text-primary-ink"
                : "text-ink-tertiary hover:bg-row-hover hover:text-ink-secondary"
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {view === "roster" ? (
        <>
          {message ? (
            <p
              aria-live="polite"
              className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink"
            >
              {message}
            </p>
          ) : null}

          <section>
            <h2 className="mb-2 text-sm font-medium text-ink-secondary">
              {t("coach.class.roster")}{" "}
              <span className="tabular-nums text-ink-tertiary">
                {t("schedule.spots", {
                  booked: booked.length,
                  capacity: session.capacity,
                })}
              </span>
            </h2>
            <Card>
              {booked.length === 0 &&
              waitlisted.length === 0 &&
              walkIns.length === 0 ? (
                <p className="text-sm text-ink-tertiary">
                  {t("coach.class.noRoster")}
                </p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {booked.map((r) => (
                    <li
                      key={r.bookingId}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar url={r.avatarUrl} name={r.name} size="md" />
                        <p className="min-w-0 break-words text-sm font-medium">
                          {r.name}
                        </p>
                      </span>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {drawerComponents.length > 0 && r.attendanceId ? (
                          <Button
                            variant="ghost"
                            disabled={pending}
                            onClick={() =>
                              setScoring({ memberId: r.memberId, name: r.name })
                            }
                          >
                            {scoreCount(r.memberId) > 0
                              ? `${t("scorelog.edit")} (${scoreCount(r.memberId)})`
                              : t("scorelog.log")}
                          </Button>
                        ) : null}
                        {r.attendanceId ? (
                          <>
                            <Pill tone="success">{t("checkin.done")}</Pill>
                            <Button
                              variant="ghost"
                              disabled={pending}
                              onClick={() =>
                                run(() =>
                                  undoCheckIn(r.attendanceId!, session.id),
                                )
                              }
                            >
                              {t("coach.class.undo")}
                            </Button>
                          </>
                        ) : (
                          <Button
                            disabled={pending}
                            onClick={() =>
                              run(() => checkIn(session.id, r.memberId))
                            }
                          >
                            {t("coach.class.checkIn")}
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                  {walkIns.map((w) => (
                    <li
                      key={w.attendanceId}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar url={w.avatarUrl} name={w.name} size="md" />
                        <p className="min-w-0 break-words text-sm font-medium">
                          {w.name}{" "}
                          <span className="text-xs text-ink-tertiary">
                            · {t("coach.class.walkIn")}
                          </span>
                        </p>
                      </span>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {drawerComponents.length > 0 ? (
                          <Button
                            variant="ghost"
                            disabled={pending}
                            onClick={() =>
                              setScoring({ memberId: w.memberId, name: w.name })
                            }
                          >
                            {scoreCount(w.memberId) > 0
                              ? `${t("scorelog.edit")} (${scoreCount(w.memberId)})`
                              : t("scorelog.log")}
                          </Button>
                        ) : null}
                        <Pill tone="success">{t("checkin.done")}</Pill>
                        <Button
                          variant="ghost"
                          disabled={pending}
                          onClick={() =>
                            run(() => undoCheckIn(w.attendanceId, session.id))
                          }
                        >
                          {t("coach.class.undo")}
                        </Button>
                      </div>
                    </li>
                  ))}
                  {waitlisted.map((r) => (
                    <li
                      key={r.bookingId}
                      className="flex flex-col gap-3 py-3 opacity-75 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar url={r.avatarUrl} name={r.name} size="md" />
                        <p className="min-w-0 break-words text-sm">{r.name}</p>
                      </span>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <Pill tone="info">{t("booking.waitlistedPill")}</Pill>
                        {!r.attendanceId ? (
                          <Button
                            variant="secondary"
                            disabled={pending}
                            onClick={() =>
                              run(() => checkIn(session.id, r.memberId))
                            }
                          >
                            {t("coach.class.checkIn")}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <Card>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="block flex-1">
                  <span className="mb-1 block text-sm font-medium text-ink-secondary">
                    {t("coach.class.walkIn")}
                  </span>
                  <select
                    className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
                    value={walkInId}
                    onChange={(e) => setWalkInId(e.target.value)}
                  >
                    <option value="">{t("coach.class.walkInPick")}</option>
                    {addable.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  disabled={pending || !walkInId}
                  onClick={() => {
                    const id = walkInId;
                    setWalkInId("");
                    run(() => checkIn(session.id, id));
                  }}
                >
                  {t("coach.class.checkIn")}
                </Button>
              </div>
            </Card>
          </section>
        </>
      ) : view === "workout" ? (
        wod ? (
          <WodCard wod={wod} hidden={false} />
        ) : (
          <Card>
            <p className="text-sm text-ink-tertiary">{t("wod.none")}</p>
          </Card>
        )
      ) : board ? (
        <WhiteboardBoard board={board} />
      ) : (
        <Card>
          <p className="text-sm text-ink-tertiary">{t("whiteboard.noWod")}</p>
        </Card>
      )}

      {scoring ? (
        <ScoreDrawer
          open
          onClose={() => setScoring(null)}
          components={drawerComponents}
          existing={existingFor(scoring.memberId)}
          date={session.date}
          memberId={scoring.memberId}
          memberName={scoring.name}
        />
      ) : null}
    </div>
  );
}
