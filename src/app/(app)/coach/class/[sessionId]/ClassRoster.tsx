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
import type { BookingResult } from "@/lib/bookings/actions";

type RosterRow = {
  bookingId: string;
  memberId: string;
  name: string;
  status: "booked" | "waitlisted";
  attendanceId: string | null;
};

export function ClassRoster({
  session,
  roster,
  walkIns,
  addable,
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
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [walkInId, setWalkInId] = useState("");

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
    </div>
  );
}
