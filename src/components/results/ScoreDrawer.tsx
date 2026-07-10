"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { logResult, type ScoreValues } from "@/lib/results/actions";
import type { LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

type ScoreType = Database["public"]["Enums"]["score_type"];

export type ScorableComponent = {
  id: string;
  scoreType: ScoreType;
  label: string; // kind/title summary for the picker
};

export type ExistingScore = {
  is_rx: boolean;
  comment: string | null;
  time_seconds: number | null;
  rounds: number | null;
  reps: number | null;
  load_kg: number | null;
  distance_m: number | null;
  calories: number | null;
};

const inputCls =
  "w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2.5 text-lg tabular-nums text-ink-primary focus:outline-none focus:shadow-[var(--focus-ring)]";

/** Keypad-friendly, score-type-aware entry. Used by members (self) and
 *  coaches (on-behalf, memberId + memberName set). */
export function ScoreDrawer({
  open,
  onClose,
  components,
  initialComponentId,
  existing,
  date,
  memberId,
  memberName,
}: {
  open: boolean;
  onClose: () => void;
  components: ScorableComponent[];
  initialComponentId?: string;
  existing?: Partial<Record<string, ExistingScore>>; // by componentId
  date: string;
  memberId?: string;
  memberName?: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [componentId, setComponentId] = useState(
    initialComponentId ?? components[0]?.id ?? ""
  );
  const [isRx, setIsRx] = useState(false);
  const [comment, setComment] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState<"ok" | "pr" | "error" | null>(null);

  const component = components.find((c) => c.id === componentId);

  function fieldsFor(existingScore?: ExistingScore): Record<string, string> {
    if (!existingScore) return {};
    return {
      min: existingScore.time_seconds != null ? String(Math.floor(existingScore.time_seconds / 60)) : "",
      sec: existingScore.time_seconds != null ? String(existingScore.time_seconds % 60) : "",
      rounds: existingScore.rounds != null ? String(existingScore.rounds) : "",
      reps: existingScore.reps != null ? String(existingScore.reps) : "",
      load: existingScore.load_kg != null ? String(existingScore.load_kg) : "",
      distance: existingScore.distance_m != null ? String(existingScore.distance_m) : "",
      calories: existingScore.calories != null ? String(existingScore.calories) : "",
    };
  }

  function selectComponent(id: string) {
    setComponentId(id);
    const ex = existing?.[id];
    setFields(fieldsFor(ex));
    setIsRx(ex?.is_rx ?? false);
    setComment(ex?.comment ?? "");
    setResult(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!component) return;
    const values: ScoreValues = {};
    if (component.scoreType === "time") {
      values.timeSeconds = (Number(fields.min) || 0) * 60 + (Number(fields.sec) || 0);
    } else if (component.scoreType === "rounds_reps") {
      values.rounds = Number(fields.rounds) || 0;
      values.reps = Number(fields.reps) || 0;
    } else if (component.scoreType === "load") {
      values.loadKg = Number(fields.load) || 0;
    } else if (component.scoreType === "reps") {
      values.reps = Number(fields.reps) || 0;
    } else if (component.scoreType === "distance") {
      values.distanceM = Number(fields.distance) || 0;
    } else if (component.scoreType === "calories") {
      values.calories = Number(fields.calories) || 0;
    }

    startTransition(async () => {
      const res = await logResult({
        componentId: component.id,
        memberId,
        date,
        isRx,
        comment: comment || undefined,
        values,
      });
      if (!res.ok) {
        setResult("error");
        return;
      }
      setResult(res.isPr ? "pr" : "ok");
      router.refresh();
      setTimeout(onClose, res.isPr ? 1600 : 800);
    });
  }

  return (
    <Drawer open={open} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("scorelog.log")}</h2>
          {memberName ? (
            <span className="text-xs text-ink-tertiary">
              {t("scorelog.forMember", { name: memberName })}
            </span>
          ) : null}
        </div>

        {components.length > 1 ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">
              {t("scorelog.component")}
            </span>
            <select
              className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
              value={componentId}
              onChange={(e) => selectComponent(e.target.value)}
            >
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {component?.scoreType === "time" ? (
          <div className="flex gap-2">
            <label className="block flex-1">
              <span className="mb-1 block text-sm text-ink-tertiary">{t("scorelog.minutes")}</span>
              <input className={inputCls} inputMode="numeric" pattern="[0-9]*" required
                value={fields.min ?? ""} onChange={(e) => setFields({ ...fields, min: e.target.value })} />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-sm text-ink-tertiary">{t("scorelog.seconds")}</span>
              <input className={inputCls} inputMode="numeric" pattern="[0-9]*" required
                value={fields.sec ?? ""} onChange={(e) => setFields({ ...fields, sec: e.target.value })} />
            </label>
          </div>
        ) : component?.scoreType === "rounds_reps" ? (
          <div className="flex gap-2">
            <label className="block flex-1">
              <span className="mb-1 block text-sm text-ink-tertiary">{t("scorelog.rounds")}</span>
              <input className={inputCls} inputMode="numeric" pattern="[0-9]*" required
                value={fields.rounds ?? ""} onChange={(e) => setFields({ ...fields, rounds: e.target.value })} />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-sm text-ink-tertiary">{t("scorelog.reps")}</span>
              <input className={inputCls} inputMode="numeric" pattern="[0-9]*"
                value={fields.reps ?? ""} onChange={(e) => setFields({ ...fields, reps: e.target.value })} />
            </label>
          </div>
        ) : component?.scoreType === "load" ? (
          <label className="block">
            <span className="mb-1 block text-sm text-ink-tertiary">{t("scorelog.loadKg")}</span>
            <input className={inputCls} inputMode="decimal" required
              value={fields.load ?? ""} onChange={(e) => setFields({ ...fields, load: e.target.value })} />
          </label>
        ) : component?.scoreType === "reps" ? (
          <label className="block">
            <span className="mb-1 block text-sm text-ink-tertiary">{t("scorelog.reps")}</span>
            <input className={inputCls} inputMode="numeric" pattern="[0-9]*" required
              value={fields.reps ?? ""} onChange={(e) => setFields({ ...fields, reps: e.target.value })} />
          </label>
        ) : component?.scoreType === "distance" ? (
          <label className="block">
            <span className="mb-1 block text-sm text-ink-tertiary">{t("scorelog.distanceM")}</span>
            <input className={inputCls} inputMode="decimal" required
              value={fields.distance ?? ""} onChange={(e) => setFields({ ...fields, distance: e.target.value })} />
          </label>
        ) : component?.scoreType === "calories" ? (
          <label className="block">
            <span className="mb-1 block text-sm text-ink-tertiary">{t("scorelog.calories")}</span>
            <input className={inputCls} inputMode="numeric" pattern="[0-9]*" required
              value={fields.calories ?? ""} onChange={(e) => setFields({ ...fields, calories: e.target.value })} />
          </label>
        ) : null}

        <div className="flex rounded-lg border border-hairline p-0.5">
          <button
            type="button"
            onClick={() => setIsRx(true)}
            className={`flex-1 rounded-md py-2 text-sm font-semibold ${
              isRx ? "bg-accent-soft text-accent-ink" : "text-ink-tertiary"
            }`}
          >
            {t("scorelog.rx")}
          </button>
          <button
            type="button"
            onClick={() => setIsRx(false)}
            className={`flex-1 rounded-md py-2 text-sm font-semibold ${
              !isRx ? "bg-info-soft text-info-ink" : "text-ink-tertiary"
            }`}
          >
            {t("scorelog.scaled")}
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm text-ink-tertiary">{t("scorelog.comment")}</span>
          <input
            className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>

        {result === "error" ? (
          <p className="text-sm text-danger-ink">{t("scorelog.error")}</p>
        ) : result === "pr" ? (
          <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-ink">
            {t("scorelog.savedPr")}
          </p>
        ) : result === "ok" ? (
          <p className="text-sm text-success-ink">{t("scorelog.saved")}</p>
        ) : null}

        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending || !component} className="flex-1">
            {pending ? t("common.loading") : t("scorelog.save")}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export function scoreTypeLabel(
  t: (key: LocaleKey, params?: Record<string, string | number>) => string,
  scoreType: ScoreType
): string {
  return t(`score.${scoreType}` as LocaleKey);
}
