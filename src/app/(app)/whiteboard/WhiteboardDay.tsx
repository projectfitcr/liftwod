"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { WhiteboardBoard } from "@/components/whiteboard/WhiteboardBoard";
import { formatDate } from "@/lib/format";
import { addDays } from "@/lib/dates";
import type { Board } from "@/lib/whiteboard/queries";

export function WhiteboardDay({
  date,
  board,
}: {
  date: string;
  board: Board | null;
}) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">
          {t("whiteboard.title")}{" "}
          <span className="font-normal text-ink-tertiary">
            · {formatDate(language, date)}
          </span>
        </h1>
        <div className="flex items-center gap-1.5 text-sm">
          <Link
            href={`/whiteboard?date=${addDays(date, -1)}`}
            className="rounded-lg border border-hairline px-2.5 py-1 text-ink-secondary hover:bg-row-hover"
            aria-label="previous day"
          >
            ←
          </Link>
          <Link
            href={`/whiteboard?date=${addDays(date, 1)}`}
            className="rounded-lg border border-hairline px-2.5 py-1 text-ink-secondary hover:bg-row-hover"
            aria-label="next day"
          >
            →
          </Link>
        </div>
      </div>

      {board ? (
        <WhiteboardBoard board={board} />
      ) : (
        <Card>
          <p className="text-sm text-ink-tertiary">{t("whiteboard.noWod")}</p>
        </Card>
      )}
    </div>
  );
}
