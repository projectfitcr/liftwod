"use client";

import { useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { WodCard, type WodView } from "@/components/wod/WodCard";
import {
  ScoreDrawer,
  type ExistingScore,
} from "@/components/results/ScoreDrawer";
import { formatScore } from "@/lib/format";
import type { LocaleKey } from "@/lib/i18n";

export type MyResultsByComponent = Partial<
  Record<string, ExistingScore & { is_pr: boolean }>
>;

/** WodCard + self score logging (the member's path; the coach's on-behalf
 *  path lives on the class roster). */
export function WodWithLogging({
  wod,
  hidden,
  date,
  canLog,
  myResults,
}: {
  wod: WodView;
  hidden: boolean;
  date: string;
  canLog: boolean;
  myResults: MyResultsByComponent;
}) {
  const { t, language } = useLanguage();
  const [openComponent, setOpenComponent] = useState<string | null>(null);

  const scorable = wod.components
    .filter((c) => c.scoreType !== "none")
    .map((c) => ({
      id: c.id,
      scoreType: c.scoreType,
      label: `${t(`kind.${c.kind}` as LocaleKey)}${c.title ? ` · ${c.title}` : ""}`,
    }));

  return (
    <>
      <WodCard
        wod={wod}
        hidden={hidden}
        renderScoreAction={
          canLog
            ? (componentId) => {
                const mine = myResults[componentId];
                const component = wod.components.find(
                  (c) => c.id === componentId,
                );
                return (
                  <div className="flex items-center gap-2">
                    {mine && component ? (
                      <>
                        <span className="text-sm font-semibold tabular-nums">
                          {t("scorelog.yourScore", {
                            score: formatScore(
                              language,
                              component.scoreType,
                              mine,
                            ),
                          })}
                        </span>
                        {mine.is_pr ? (
                          <Pill tone="accent">{t("whiteboard.pr")}</Pill>
                        ) : null}
                        <Pill tone={mine.is_rx ? "accent" : "info"}>
                          {mine.is_rx ? t("scorelog.rx") : t("scorelog.scaled")}
                        </Pill>
                        <Button
                          variant="ghost"
                          onClick={() => setOpenComponent(componentId)}
                        >
                          {t("scorelog.edit")}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => setOpenComponent(componentId)}
                      >
                        {t("scorelog.log")}
                      </Button>
                    )}
                  </div>
                );
              }
            : undefined
        }
      />
      {openComponent ? (
        <ScoreDrawer
          open
          onClose={() => setOpenComponent(null)}
          components={scorable}
          initialComponentId={openComponent}
          existing={myResults}
          date={date}
          successHref={`/whiteboard?date=${date}`}
        />
      ) : null}
    </>
  );
}
