"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import type { LocaleKey } from "@/lib/i18n";

export function ComingSoon({ titleKey }: { titleKey: LocaleKey }) {
  const { t } = useLanguage();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{t(titleKey)}</h1>
      <Card>
        <p className="text-sm text-ink-tertiary">{t("common.comingSoon")}</p>
      </Card>
    </div>
  );
}
