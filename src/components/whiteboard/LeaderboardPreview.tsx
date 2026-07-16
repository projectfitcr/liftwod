"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatScore } from "@/lib/format";
import type { Board } from "@/lib/whiteboard/queries";
import type { LocaleKey } from "@/lib/i18n";

export function LeaderboardPreview({
  board,
  memberId,
  date,
}: {
  board: Board;
  memberId: string;
  date: string;
}) {
  const { t, language } = useLanguage();
  const component = board.components.find((item) => item.rows.length > 0);
  if (!component) return null;

  const top = component.rows.slice(0, 3);
  const mine = component.rows.find((row) => row.memberId === memberId);
  const rows =
    mine && !top.some((row) => row.memberId === memberId)
      ? [...top, mine]
      : top;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink-secondary">
            {t("leaderboard.preview")}
          </h2>
          <p className="text-xs text-ink-tertiary">
            {t(`kind.${component.kind}` as LocaleKey)}
            {component.title ? ` · ${component.title}` : ""}
          </p>
        </div>
        <Link
          href={`/whiteboard?date=${date}`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-ink hover:underline"
        >
          {t("leaderboard.viewFull")} →
        </Link>
      </div>
      <Card className="p-0">
        <ol className="divide-y divide-hairline">
          {rows.map((row) => {
            const rank =
              component.rows.findIndex(
                (candidate) => candidate.memberId === row.memberId,
              ) + 1;
            const isMe = row.memberId === memberId;
            return (
              <li
                key={row.memberId}
                className={`flex min-h-14 items-center gap-3 px-4 ${
                  isMe ? "bg-primary-soft/50" : ""
                }`}
              >
                <span className="w-6 text-right text-sm font-bold tabular-nums text-ink-tertiary">
                  {rank}
                </span>
                <Avatar url={row.avatarUrl} name={row.memberName} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {row.memberName}
                  {isMe ? (
                    <span className="ml-1 text-xs text-primary-ink">
                      ({t("leaderboard.you")})
                    </span>
                  ) : null}
                </span>
                <Pill tone={row.isRx ? "accent" : "info"}>
                  {row.isRx ? t("scorelog.rx") : t("scorelog.scaled")}
                </Pill>
                <span className="text-sm font-bold tabular-nums">
                  {formatScore(language, component.scoreType, row)}
                </span>
              </li>
            );
          })}
        </ol>
      </Card>
    </section>
  );
}
