"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { type WodView } from "@/components/wod/WodCard";
import {
  WodWithLogging,
  type MyResultsByComponent,
} from "@/components/wod/WodWithLogging";
import { addDays } from "@/lib/dates";
import { formatDate } from "@/lib/format";

export function WodDay({
  date,
  wod,
  myResults,
  hidden,
}: {
  date: string;
  wod: WodView | null;
  myResults: MyResultsByComponent;
  hidden: boolean;
}) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">
          {t("wod.title")}{" "}
          <span className="font-normal text-ink-tertiary">
            · {formatDate(language, date)}
          </span>
        </h1>
        <div className="flex shrink-0 items-center gap-1.5 text-sm">
          <Link
            href={`/wod/${addDays(date, -1)}`}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline text-ink-secondary hover:bg-row-hover"
            aria-label={t("common.previous")}
          >
            ←
          </Link>
          <Link
            href={`/wod/${addDays(date, 1)}`}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline text-ink-secondary hover:bg-row-hover"
            aria-label={t("common.next")}
          >
            →
          </Link>
        </div>
      </div>
      {wod ? (
        <WodWithLogging
          wod={wod}
          hidden={hidden}
          date={date}
          canLog
          myResults={myResults}
        />
      ) : (
        <Card>
          <p className="text-sm text-ink-tertiary">{t("wod.none")}</p>
        </Card>
      )}
    </div>
  );
}
