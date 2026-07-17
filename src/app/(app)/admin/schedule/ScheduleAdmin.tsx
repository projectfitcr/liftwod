"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Icon } from "@/components/shell/Icon";
import { formatClockTime, formatDate } from "@/lib/format";
import {
  cancelSession,
  createTemplate,
  setTemplateActive,
  updateSessionCapacity,
  updateSessionCoach,
} from "@/lib/schedule/actions";
import type { LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

type Template = Database["public"]["Tables"]["class_templates"]["Row"];
type Session = Database["public"]["Tables"]["class_sessions"]["Row"] & {
  booked: number;
  waiting: number;
};
type Staff = { id: string; full_name: string };

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export function ScheduleAdmin({
  templates,
  sessions,
  staff,
}: {
  templates: Template[];
  sessions: Session[];
  staff: Staff[];
}) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(templates.length === 0);
  const [name, setName] = useState("WOD");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [capacity, setCapacity] = useState("12");
  const [coachId, setCoachId] = useState("");
  const [capEdits, setCapEdits] = useState<Record<string, string>>({});
  const [coachEdits, setCoachEdits] = useState<Record<string, string>>({});
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);

  const staffName = new Map(staff.map((s) => [s.id, s.full_name]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (days.length === 0) return;
    startTransition(async () => {
      const res = await createTemplate({
        name,
        days,
        startTime: time,
        durationMinutes: Number(duration) || 60,
        capacity: Number(capacity) || 12,
        coachId: coachId || undefined,
      });
      if (res.ok) setShowForm(false);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("admin.schedule.title")}</h1>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {t("admin.schedule.newTemplate")}
        </Button>
      </div>

      {showForm ? (
        <Card>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("admin.schedule.name")}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div>
              <span className="mb-1 block text-sm font-medium text-ink-secondary">
                {t("admin.schedule.days")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setDays((cur) =>
                        cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      days.includes(d)
                        ? "bg-primary-soft text-primary-ink"
                        : "bg-surface-raised text-ink-tertiary"
                    }`}
                  >
                    {t(`day.${d}` as LocaleKey)}
                  </button>
                ))}
              </div>
            </div>
            <Field
              label={t("admin.schedule.time")}
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <Field
              label={t("admin.schedule.duration")}
              type="number"
              inputMode="numeric"
              min={15}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <Field
              label={t("admin.schedule.capacity")}
              type="number"
              inputMode="numeric"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-secondary">
                {t("admin.schedule.coach")}
              </span>
              <select
                className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
              >
                <option value="">{t("admin.schedule.noCoach")}</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending || days.length === 0}>
                {pending ? t("common.loading") : t("admin.schedule.create")}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("admin.schedule.templates")}
        </h2>
        <Card>
          {templates.length === 0 ? (
            <p className="text-sm text-ink-tertiary">{t("admin.schedule.noTemplates")}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {templates.map((tpl) => (
                <li key={tpl.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {t(`day.${tpl.day_of_week}` as LocaleKey)}{" "}
                      <span className="tabular-nums">{tpl.start_time.slice(0, 5)}</span> ·{" "}
                      {tpl.name}
                      {!tpl.is_active ? (
                        <span className="ml-2 align-middle">
                          <Pill tone="danger">{t("admin.schedule.inactive")}</Pill>
                        </span>
                      ) : null}
                    </p>
                    <p className="break-words text-xs text-ink-tertiary">
                      {t("admin.schedule.capacity")} {tpl.capacity}
                      {tpl.coach_id && staffName.get(tpl.coach_id)
                        ? ` · ${t("schedule.coachPrefix", { name: staffName.get(tpl.coach_id)! })}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      startTransition(() => setTemplateActive(tpl.id, !tpl.is_active))
                    }
                  >
                    {tpl.is_active
                      ? t("admin.schedule.deactivate")
                      : t("admin.plans.reactivate")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("admin.schedule.upcoming")}
        </h2>
        <Card>
          {sessions.length === 0 ? (
            <p className="text-sm text-ink-tertiary">{t("admin.schedule.noSessions")}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm">
                      <span className="whitespace-nowrap">
                        {formatDate(language, s.session_date)}{" "}
                        <span className="tabular-nums">{formatClockTime(s.starts_at)}</span>
                      </span>{" "}
                      · {s.name}
                      {s.status === "cancelled" ? (
                        <span className="ml-2 align-middle">
                          <Pill tone="danger">{t("schedule.cancelledSession")}</Pill>
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs tabular-nums text-ink-tertiary">
                      {t("schedule.spots", { booked: s.booked, capacity: s.capacity })}
                      {s.waiting > 0 ? ` · ${t("schedule.waiting", { count: s.waiting })}` : ""}
                    </p>
                    <div className="mt-2 max-w-sm">
                      <span className="shrink-0 text-xs font-medium text-ink-secondary">
                        {t("admin.schedule.coach")}
                      </span>
                      {editingCoachId === s.id ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <select
                            aria-label={t("coach.class.assignedCoach")}
                            className="min-h-10 min-w-0 flex-1 rounded-lg border border-hairline bg-surface-raised px-2.5 py-1.5 text-sm disabled:opacity-60"
                            value={coachEdits[s.id] ?? s.coach_id ?? ""}
                            disabled={pending}
                            onChange={(event) =>
                              setCoachEdits((current) => ({
                                ...current,
                                [s.id]: event.target.value,
                              }))
                            }
                          >
                            <option value="">{t("coach.class.noCoach")}</option>
                            {staff.map((person) => (
                              <option key={person.id} value={person.id}>
                                {person.full_name}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                const result = await updateSessionCoach(
                                  s.id,
                                  (coachEdits[s.id] ?? s.coach_id) || null,
                                );
                                if (result.ok) {
                                  setEditingCoachId(null);
                                } else {
                                  setCoachEdits((current) => ({
                                    ...current,
                                    [s.id]: s.coach_id ?? "",
                                  }));
                                }
                              })
                            }
                          >
                            {t("common.save")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() => {
                              setCoachEdits((current) => ({
                                ...current,
                                [s.id]: s.coach_id ?? "",
                              }));
                              setEditingCoachId(null);
                            }}
                          >
                            {t("common.cancel")}
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-1 flex min-h-10 items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-raised px-2.5 py-1">
                          <span className="min-w-0 truncate text-sm">
                            {staffName.get(coachEdits[s.id] ?? s.coach_id ?? "") ??
                              t("coach.class.noCoach")}
                          </span>
                          <button
                            type="button"
                            className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-row-hover hover:text-ink-primary"
                            aria-label={t("coach.class.editCoach")}
                            onClick={() => {
                              setCoachEdits((current) => ({
                                ...current,
                                [s.id]: current[s.id] ?? s.coach_id ?? "",
                              }));
                              setEditingCoachId(s.id);
                            }}
                          >
                            <Icon name="edit" className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {s.status === "scheduled" ? (
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
                      <input
                        type="number"
                        min={1}
                        className="w-16 rounded-lg border border-hairline bg-surface-raised px-2 py-1 text-sm tabular-nums"
                        value={capEdits[s.id] ?? String(s.capacity)}
                        onChange={(e) =>
                          setCapEdits({ ...capEdits, [s.id]: e.target.value })
                        }
                      />
                      <Button
                        variant="ghost"
                        disabled={pending || (capEdits[s.id] ?? String(s.capacity)) === String(s.capacity)}
                        onClick={() =>
                          startTransition(async () => {
                            await updateSessionCapacity(s.id, Number(capEdits[s.id]));
                          })
                        }
                      >
                        {t("admin.schedule.saveCapacity")}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm(t("admin.schedule.cancelSessionConfirm"))) {
                            startTransition(() => cancelSession(s.id));
                          }
                        }}
                      >
                        {t("admin.schedule.cancelSession")}
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
