"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";

export function TodayView({ name }: { name: string }) {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{t("today.title")}</h1>
      {name ? <p className="mb-4 text-sm text-ink-tertiary">{name}</p> : null}
      <Card>
        <p className="text-sm text-ink-tertiary">{t("today.placeholder")}</p>
      </Card>
    </div>
  );
}
