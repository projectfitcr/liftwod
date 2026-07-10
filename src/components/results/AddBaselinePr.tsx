"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { ScoreDrawer, type ScorableComponent } from "@/components/results/ScoreDrawer";
import { getBaselineComponent } from "@/lib/results/actions";
import { bangkokToday } from "@/lib/dates";
import { localizedName } from "@/lib/i18n";

export type BaselineBenchmark = { id: string; name: string };
export type BaselineLift = { id: string; name_en: string; name_th: string | null };

/** "Record an existing PR": pick a benchmark or tracked lift, then reuse the
 *  normal score drawer (with an achieved-on date) against the shared baseline
 *  component. The PR triggers treat it like any other result. */
export function AddBaselinePr({
  benchmarks,
  lifts,
}: {
  benchmarks: BaselineBenchmark[];
  lifts: BaselineLift[];
}) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [choice, setChoice] = useState(""); // "benchmark:<id>" | "lift:<id>"
  const [error, setError] = useState(false);
  const [scoring, setScoring] = useState<ScorableComponent | null>(null);

  function proceed() {
    const [kind, refId] = choice.split(":") as ["benchmark" | "lift", string];
    const label =
      kind === "benchmark"
        ? (benchmarks.find((b) => b.id === refId)?.name ?? "")
        : localizedName(language, lifts.find((l) => l.id === refId) ?? { name_en: "", name_th: null });
    setError(false);
    startTransition(async () => {
      const res = await getBaselineComponent(kind, refId);
      if (!res.ok) {
        setError(true);
        return;
      }
      setPickerOpen(false);
      setScoring({ id: res.componentId, scoreType: res.scoreType, label });
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
        {t("results.addPr")}
      </Button>

      <Drawer open={pickerOpen} onClose={() => setPickerOpen(false)}>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("results.addPrTitle")}</h2>
          <p className="text-xs text-ink-tertiary">{t("results.addPrHint")}</p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">
              {t("results.pickOne")}
            </span>
            <select
              className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
            >
              <option value="" />
              <optgroup label={t("results.liftsGroup")}>
                {lifts.map((l) => (
                  <option key={l.id} value={`lift:${l.id}`}>
                    {localizedName(language, l)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t("results.benchmarksGroup")}>
                {benchmarks.map((b) => (
                  <option key={b.id} value={`benchmark:${b.id}`}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          {error ? <p className="text-sm text-danger-ink">{t("common.error")}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setPickerOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={pending || !choice}
              onClick={proceed}
            >
              {pending ? t("common.loading") : t("common.continue")}
            </Button>
          </div>
        </div>
      </Drawer>

      {scoring ? (
        <ScoreDrawer
          open
          onClose={() => setScoring(null)}
          components={[scoring]}
          date={bangkokToday()}
          showDateField
        />
      ) : null}
    </>
  );
}
