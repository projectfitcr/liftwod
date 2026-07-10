"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatClockTime, formatDate } from "@/lib/format";
import { checkIn, undoCheckIn } from "@/lib/attendance/actions";
import { bookingMessage } from "@/components/schedule/ClassCard";
import {
  ScoreDrawer,
  type ExistingScore,
} from "@/components/results/ScoreDrawer";
import type { BookingResult } from "@/lib/bookings/actions";
import type { LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

type ScoreType = Database["public"]["Enums"]["score_type"];
type ComponentKind = Database["public"]["Enums"]["component_kind"];

type RosterRow = {
  bookingId: string;
  memberId: string;
  name: string;
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
  walkIns: { memberId: string; name: string; attendanceId: string }[];
  addable: { id: string; name: string }[];
  scorableComponents: {
    id: string;
    scoreType: ScoreType;
    kind: ComponentKind;
    title: string | null;
  }[];
  dayResults: DayResult[];
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [walkInId, setWalkInId] = useState("");
  const [scoring, setScoring] = useState<{ memberId: string; name: string } | null>(null);

  const drawerComponents = scorableComponents.map((c) => ({
    id: c.id,
    scoreType: c.scoreType,
    label: `${t(`kind.${c.kind}` as LocaleKey)}${c.title ? ` · ${c.title}` : ""}`,
  }));

  function existingFor(memberId: string): Partial<Record<string, ExistingScore>> {
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          {session.name}{" "}
          <span className="font-normal text-ink-tertiary">
            · {formatDate(language, session.date)}{" "}
            <span className="tabular-nums">{formatClockTime(session.startsAt)}</span>
          </span>
        </h1>
        {session.status === "cancelled" ? (
          <Pill tone="danger">{t("schedule.cancelledSession")}</Pill>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink">
          {message}
        </p>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("coach.class.roster")}{" "}
          <span className="tabular-nums text-ink-tertiary">
            {t("schedule.spots", { booked: booked.length, capacity: session.capacity })}
          </span>
        </h2>
        <Card>
          {booked.length === 0 && waitlisted.length === 0 && walkIns.length === 0 ? (
            <p className="text-sm text-ink-tertiary">{t("coach.class.noRoster")}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {booked.map((r) => (
                <li key={r.bookingId} className="flex items-center justify-between gap-3 py-2.5">
                  <p className="min-w-0 break-words text-sm font-medium">{r.name}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    {drawerComponents.length > 0 && r.attendanceId ? (
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() => setScoring({ memberId: r.memberId, name: r.name })}
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
                            run(() => undoCheckIn(r.attendanceId!, session.id))
                          }
                        >
                          {t("coach.class.undo")}
                        </Button>
                      </>
                    ) : (
                      <Button
                        disabled={pending}
                        onClick={() => run(() => checkIn(session.id, r.memberId))}
                      >
                        {t("coach.class.checkIn")}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
              {walkIns.map((w) => (
                <li key={w.attendanceId} className="flex items-center justify-between gap-3 py-2.5">
                  <p className="min-w-0 break-words text-sm font-medium">
                    {w.name}{" "}
                    <span className="text-xs text-ink-tertiary">
                      · {t("coach.class.walkIn")}
                    </span>
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    {drawerComponents.length > 0 ? (
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() => setScoring({ memberId: w.memberId, name: w.name })}
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
                      onClick={() => run(() => undoCheckIn(w.attendanceId, session.id))}
                    >
                      {t("coach.class.undo")}
                    </Button>
                  </div>
                </li>
              ))}
              {waitlisted.map((r) => (
                <li key={r.bookingId} className="flex items-center justify-between gap-3 py-2.5 opacity-75">
                  <p className="min-w-0 break-words text-sm">{r.name}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <Pill tone="info">{t("booking.waitlistedPill")}</Pill>
                    {!r.attendanceId ? (
                      <Button
                        variant="secondary"
                        disabled={pending}
                        onClick={() => run(() => checkIn(session.id, r.memberId))}
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
          <div className="flex items-end gap-2">
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
