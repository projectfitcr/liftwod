"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatScore } from "@/lib/format";
import type { Board } from "@/lib/whiteboard/queries";
import type { LocaleKey } from "@/lib/i18n";

/** Ranked results board; `density="tv"` scales for the gym TV. */
export function WhiteboardBoard({
  board,
  density = "phone",
}: {
  board: Board;
  density?: "phone" | "tv";
}) {
  const { t, language } = useLanguage();
  const tv = density === "tv";

  return (
    <div className={tv ? "space-y-8" : "space-y-4"}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={`font-bold ${tv ? "text-4xl" : "text-lg"}`}>{board.wodTitle}</h2>
        {board.benchmarkName ? (
          <Pill tone="accent">
            {t("wod.benchmark")} · {board.benchmarkName}
          </Pill>
        ) : null}
      </div>

      {board.components.map((c) => (
        <Card key={c.id} className={tv ? "p-6" : ""}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`font-semibold uppercase tracking-wide text-ink-tertiary ${
                tv ? "text-xl" : "text-xs"
              }`}
            >
              {t(`kind.${c.kind}` as LocaleKey)}
              {c.title ? ` · ${c.title}` : ""}
            </span>
            <Pill tone="primary">{t(`score.${c.scoreType}` as LocaleKey)}</Pill>
          </div>

          {c.rows.length === 0 ? (
            <p className={`text-ink-tertiary ${tv ? "text-2xl" : "text-sm"}`}>
              {t("whiteboard.empty")}
            </p>
          ) : (
            <ol className="divide-y divide-hairline">
              {c.rows.map((r, i) => (
                <li
                  key={r.memberId}
                  className={`flex items-center gap-3 ${tv ? "py-3" : "py-2"}`}
                >
                  <span
                    className={`w-8 shrink-0 text-right tabular-nums font-semibold ${
                      tv ? "text-3xl" : "text-sm"
                    } ${i === 0 ? "text-primary" : "text-ink-tertiary"}`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`min-w-0 flex-1 break-words font-medium ${
                      tv ? "text-3xl" : "text-sm"
                    }`}
                  >
                    {r.memberName}
                    {r.openGym ? (
                      <span className={`ml-2 text-ink-tertiary ${tv ? "text-xl" : "text-xs"}`}>
                        ({t("whiteboard.openGym")})
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {r.isPr ? <Pill tone="accent">{t("whiteboard.pr")} 🎉</Pill> : null}
                    <Pill tone={r.isRx ? "accent" : "info"}>
                      {r.isRx ? t("scorelog.rx") : t("scorelog.scaled")}
                    </Pill>
                    <span
                      className={`whitespace-nowrap tabular-nums font-bold ${
                        tv ? "text-3xl" : "text-base"
                      }`}
                    >
                      {formatScore(language, c.scoreType, r)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      ))}
    </div>
  );
}
