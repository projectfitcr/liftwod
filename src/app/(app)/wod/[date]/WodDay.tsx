"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { WodCard, type WodView } from "@/components/wod/WodCard";
import { formatDate } from "@/lib/format";

export function WodDay({
  date,
  wod,
  hidden,
}: {
  date: string;
  wod: WodView | null;
  hidden: boolean;
}) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        {t("wod.title")}{" "}
        <span className="font-normal text-ink-tertiary">
          · {formatDate(language, date)}
        </span>
      </h1>
      {wod ? (
        <WodCard wod={wod} hidden={hidden} />
      ) : (
        <Card>
          <p className="text-sm text-ink-tertiary">{t("wod.none")}</p>
        </Card>
      )}
    </div>
  );
}
