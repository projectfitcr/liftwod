"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatDateTime } from "@/lib/format";
import { localizedName, type LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

type ComponentKind = Database["public"]["Enums"]["component_kind"];
type ScoreType = Database["public"]["Enums"]["score_type"];

export type WodView = {
  id: string;
  title: string;
  benchmarkName: string | null;
  coachNotes: string | null;
  published: boolean;
  revealAt: string | null;
  components: {
    id: string;
    kind: ComponentKind;
    title: string | null;
    description: string;
    scoreType: ScoreType;
    exercises: { id: string; name_en: string; name_th: string | null; demo_url: string | null }[];
  }[];
};

/** Member-facing WOD render. Coach free text is shown exactly as typed
 *  (either language, PRD 6.7); all chrome is translated. `hidden` is only
 *  ever true for staff viewers — RLS keeps it from members entirely.
 *  `renderScoreAction` lets hosts add a log-score affordance per component. */
export function WodCard({
  wod,
  hidden = false,
  renderScoreAction,
}: {
  wod: WodView;
  hidden?: boolean;
  renderScoreAction?: (componentId: string) => React.ReactNode;
}) {
  const { t, language } = useLanguage();

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="break-words text-base font-semibold">{wod.title}</p>
        {wod.benchmarkName ? (
          <Pill tone="accent">
            {t("wod.benchmark")} · {wod.benchmarkName}
          </Pill>
        ) : null}
        {hidden ? (
          <Pill tone="warning">
            {!wod.published
              ? t("wod.draft")
              : t("wod.hiddenUntil", {
                  time: formatDateTime(language, wod.revealAt),
                })}
          </Pill>
        ) : null}
      </div>

      {wod.components.map((c) => (
        <div key={c.id} className="rounded-lg border border-hairline bg-surface-raised p-3">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {t(`kind.${c.kind}` as LocaleKey)}
            </span>
            {c.title ? <span className="break-words text-sm font-medium">{c.title}</span> : null}
            {c.scoreType !== "none" ? (
              <Pill tone="primary">{t(`score.${c.scoreType}` as LocaleKey)}</Pill>
            ) : null}
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {c.description}
          </p>
          {c.exercises.length > 0 ? (
            <p className="mt-2 flex flex-wrap gap-1.5">
              {c.exercises.map((e) =>
                e.demo_url ? (
                  <a
                    key={e.id}
                    href={e.demo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-info-soft px-2.5 py-0.5 text-xs text-info-ink hover:underline"
                  >
                    {localizedName(language, e)} ▶
                  </a>
                ) : (
                  <span
                    key={e.id}
                    className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-ink-secondary"
                  >
                    {localizedName(language, e)}
                  </span>
                )
              )}
            </p>
          ) : null}
          {c.scoreType !== "none" && renderScoreAction ? (
            <div className="mt-2">{renderScoreAction(c.id)}</div>
          ) : null}
        </div>
      ))}

      {wod.coachNotes ? (
        <div>
          <p className="mb-1 text-xs font-medium text-ink-tertiary">{t("wod.coachNotes")}</p>
          <p className="whitespace-pre-wrap break-words text-sm text-ink-secondary">
            {wod.coachNotes}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
