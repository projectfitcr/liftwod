"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  AddBaselinePr,
  type BaselineBenchmark,
  type BaselineLift,
} from "@/components/results/AddBaselinePr";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatDate, formatMMSS, formatNumber, formatScore } from "@/lib/format";
import { localizedName, type LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

type ScoreType = Database["public"]["Enums"]["score_type"];

type PrRow = {
  id: string;
  kind: "benchmark" | "lift";
  scoreType: ScoreType;
  isRx: boolean;
  value: number;
  achievedOn: string;
  benchmarkName: string | null;
  exercise: { name_en: string; name_th: string | null } | null;
};

type HistoryRow = {
  id: string;
  isRx: boolean;
  isPr: boolean;
  comment: string | null;
  createdAt: string;
  scoreType: ScoreType;
  time_seconds: number | null;
  rounds: number | null;
  reps: number | null;
  load_kg: number | null;
  distance_m: number | null;
  calories: number | null;
  workoutTitle: string;
  workoutDate: string | null;
  benchmarkName: string | null;
};

function formatPrValue(language: "en" | "th", p: PrRow): string {
  if (p.scoreType === "time") return formatMMSS(p.value);
  if (p.scoreType === "rounds_reps")
    return `${Math.floor(p.value / 1000)}+${p.value % 1000}`;
  if (p.scoreType === "load") return `${formatNumber(language, p.value)} kg`;
  return formatNumber(language, p.value);
}

export function ResultsView({
  prs,
  history,
  benchmarks,
  lifts,
}: {
  prs: PrRow[];
  history: HistoryRow[];
  benchmarks: BaselineBenchmark[];
  lifts: BaselineLift[];
}) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">{t("results.title")}</h1>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink-secondary">{t("results.prs")}</h2>
          <AddBaselinePr benchmarks={benchmarks} lifts={lifts} />
        </div>
        <Card>
          {prs.length === 0 ? (
            <p className="text-sm text-ink-tertiary">{t("results.noPrs")}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {prs.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {p.kind === "benchmark"
                        ? p.benchmarkName
                        : p.exercise
                          ? localizedName(language, p.exercise)
                          : "—"}
                    </p>
                    <p className="text-xs text-ink-tertiary">
                      {formatDate(language, p.achievedOn)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {p.kind === "benchmark" ? (
                      <Pill tone={p.isRx ? "accent" : "info"}>
                        {p.isRx ? t("scorelog.rx") : t("scorelog.scaled")}
                      </Pill>
                    ) : null}
                    <span className="whitespace-nowrap text-base font-bold tabular-nums">
                      {formatPrValue(language, p)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("results.history")}
        </h2>
        <Card>
          {history.length === 0 ? (
            <p className="text-sm text-ink-tertiary">{t("results.noHistory")}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {history.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {r.benchmarkName ?? r.workoutTitle}
                      <span className="ml-2 text-xs font-normal text-ink-tertiary">
                        {t(`score.${r.scoreType}` as LocaleKey)}
                      </span>
                    </p>
                    <p className="text-xs text-ink-tertiary">
                      {formatDate(language, r.workoutDate ?? r.createdAt)}
                      {r.comment ? ` · ${r.comment}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.isPr ? <Pill tone="accent">{t("whiteboard.pr")}</Pill> : null}
                    <Pill tone={r.isRx ? "accent" : "info"}>
                      {r.isRx ? t("scorelog.rx") : t("scorelog.scaled")}
                    </Pill>
                    <span className="whitespace-nowrap text-sm font-bold tabular-nums">
                      {formatScore(language, r.scoreType, r)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
