"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { formatDate } from "@/lib/format";
import { localizedName, type LocaleKey } from "@/lib/i18n";
import {
  addComponent,
  addComponentExercise,
  deleteComponent,
  deleteWorkout,
  removeComponentExercise,
  saveWorkout,
  updateComponent,
} from "@/lib/wods/actions";
import type { Database } from "@/lib/supabase/database.types";

type ComponentKind = Database["public"]["Enums"]["component_kind"];
type ScoreType = Database["public"]["Enums"]["score_type"];

const KINDS: ComponentKind[] = ["warmup", "strength", "skill", "metcon", "cooldown", "other"];
const SCORES: ScoreType[] = ["none", "time", "rounds_reps", "load", "reps", "distance", "calories"];

type ComponentState = {
  id: string;
  kind: ComponentKind;
  title: string;
  description: string;
  scoreType: ScoreType;
  exerciseIds: string[];
};

type Exercise = { id: string; name_en: string; name_th: string | null };

/** datetime-local wants "YYYY-MM-DDTHH:mm" in Bangkok wall time. */
function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const bkk = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return bkk.toISOString().slice(0, 16);
}
function localToIso(local: string): string | null {
  if (!local) return null;
  return new Date(`${local}:00+07:00`).toISOString();
}

export function WodBuilder({
  workout,
  benchmarks,
  exercises,
}: {
  workout: {
    id: string;
    title: string;
    scheduledOn: string | null;
    benchmarkId: string | null;
    coachNotes: string;
    published: boolean;
    revealAt: string | null;
    updatedAt: string;
    editorName: string | null;
    components: ComponentState[];
  };
  benchmarks: { id: string; name: string }[];
  exercises: Exercise[];
}) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [meta, setMeta] = useState({
    title: workout.title,
    scheduledOn: workout.scheduledOn ?? "",
    benchmarkId: workout.benchmarkId ?? "",
    coachNotes: workout.coachNotes,
    published: workout.published,
    revealAt: isoToLocal(workout.revealAt),
  });
  const [components, setComponents] = useState<ComponentState[]>(workout.components);
  const [pickers, setPickers] = useState<Record<string, string>>({});

  const exName = new Map(exercises.map((e) => [e.id, e]));

  function saveMeta() {
    startTransition(async () => {
      const res = await saveWorkout(workout.id, {
        title: meta.title,
        scheduledOn: meta.scheduledOn || null,
        benchmarkId: meta.benchmarkId || null,
        coachNotes: meta.coachNotes,
        published: meta.published,
        revealAt: localToIso(meta.revealAt),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  function saveComponent(c: ComponentState) {
    startTransition(async () => {
      await updateComponent(c.id, workout.id, {
        kind: c.kind,
        scoreType: c.scoreType,
        title: c.title,
        description: c.description,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function patch(id: string, patch: Partial<ComponentState>) {
    setComponents((cur) => cur.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  const selectCls =
    "w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/coach/wods" className="text-xs text-ink-tertiary hover:underline">
            ← {t("coach.wods.title")}
          </Link>
          <h1 className="text-xl font-semibold">{t("coach.wod.builderTitle")}</h1>
          {workout.editorName ? (
            <p className="text-xs text-ink-tertiary">
              {t("coach.wods.lastEdited", {
                name: workout.editorName,
                date: formatDate(language, workout.updatedAt),
              })}
            </p>
          ) : null}
        </div>
        {saved ? (
          <span className="text-sm text-success-ink">{t("coach.wod.saved")}</span>
        ) : null}
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={t("coach.wod.name")}
            value={meta.title}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
          />
          <Field
            label={t("coach.wod.date")}
            type="date"
            value={meta.scheduledOn}
            onChange={(e) => setMeta({ ...meta, scheduledOn: e.target.value })}
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">
              {t("coach.wod.benchmarkLabel")}
            </span>
            <select
              className={selectCls}
              value={meta.benchmarkId}
              onChange={(e) => setMeta({ ...meta, benchmarkId: e.target.value })}
            >
              <option value="">{t("coach.wod.noBenchmark")}</option>
              {benchmarks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label={t("coach.wod.revealAt")}
            type="datetime-local"
            value={meta.revealAt}
            onChange={(e) => setMeta({ ...meta, revealAt: e.target.value })}
          />
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">
              {t("coach.wod.notes")}
            </span>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
              value={meta.coachNotes}
              onChange={(e) => setMeta({ ...meta, coachNotes: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={meta.published}
              onChange={(e) => setMeta({ ...meta, published: e.target.checked })}
            />
            {t("coach.wod.published")}
          </label>
          <div className="flex justify-end">
            <Button disabled={pending} onClick={saveMeta}>
              {pending ? t("common.loading") : t("coach.wod.save")}
            </Button>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink-secondary">
            {t("coach.wod.components")}
          </h2>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => startTransition(() => addComponent(workout.id))}
          >
            {t("coach.wod.addComponent")}
          </Button>
        </div>

        {components.map((c) => (
          <Card key={c.id} className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-tertiary">
                  {t("coach.wod.kind")}
                </span>
                <select
                  className={selectCls}
                  value={c.kind}
                  onChange={(e) => patch(c.id, { kind: e.target.value as ComponentKind })}
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(`kind.${k}` as LocaleKey)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-tertiary">
                  {t("coach.wod.scoreType")}
                </span>
                <select
                  className={selectCls}
                  value={c.scoreType}
                  onChange={(e) => patch(c.id, { scoreType: e.target.value as ScoreType })}
                >
                  {SCORES.map((s) => (
                    <option key={s} value={s}>
                      {t(`score.${s}` as LocaleKey)}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label={t("coach.wod.componentTitle")}
                value={c.title}
                onChange={(e) => patch(c.id, { title: e.target.value })}
              />
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-tertiary">
                {t("coach.wod.description")}
              </span>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 font-mono text-sm"
                value={c.description}
                onChange={(e) => patch(c.id, { description: e.target.value })}
              />
            </label>

            <div>
              <span className="mb-1 block text-xs font-medium text-ink-tertiary">
                {t("coach.wod.exercises")}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {c.exerciseIds.map((eid) => {
                  const ex = exName.get(eid);
                  return (
                    <span
                      key={eid}
                      className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-0.5 text-xs text-info-ink"
                    >
                      {ex ? localizedName(language, ex) : "—"}
                      <button
                        type="button"
                        className="hover:text-danger-ink"
                        onClick={() => {
                          patch(c.id, { exerciseIds: c.exerciseIds.filter((x) => x !== eid) });
                          startTransition(() =>
                            removeComponentExercise(c.id, workout.id, eid)
                          );
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
                <select
                  className="rounded-lg border border-hairline bg-surface-raised px-2 py-1 text-xs"
                  value={pickers[c.id] ?? ""}
                  onChange={(e) => setPickers({ ...pickers, [c.id]: e.target.value })}
                >
                  <option value="" />
                  {exercises
                    .filter((e) => !c.exerciseIds.includes(e.id))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {localizedName(language, e)}
                      </option>
                    ))}
                </select>
                <Button
                  variant="ghost"
                  disabled={pending || !pickers[c.id]}
                  onClick={() => {
                    const eid = pickers[c.id];
                    setPickers({ ...pickers, [c.id]: "" });
                    patch(c.id, { exerciseIds: [...c.exerciseIds, eid] });
                    startTransition(() => addComponentExercise(c.id, workout.id, eid));
                  }}
                >
                  {t("coach.wod.addExercise")}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-hairline pt-2">
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => startTransition(() => deleteComponent(c.id, workout.id))}
              >
                {t("coach.wod.removeComponent")}
              </Button>
              <Button variant="secondary" disabled={pending} onClick={() => saveComponent(c)}>
                {t("common.save")}
              </Button>
            </div>
          </Card>
        ))}
      </section>

      <Button
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (window.confirm(t("coach.wod.deleteConfirm"))) {
            startTransition(() => deleteWorkout(workout.id));
          }
        }}
      >
        {t("coach.wod.delete")}
      </Button>
    </div>
  );
}
