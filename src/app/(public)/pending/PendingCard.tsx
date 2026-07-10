"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { signOut } from "@/lib/auth/actions";

export function PendingCard({ email }: { email: string }) {
  const { t } = useLanguage();

  return (
    <Card>
      <h1 className="mb-2 text-lg font-semibold">{t("pending.title")}</h1>
      <p className="text-sm leading-relaxed text-ink-secondary">
        {t("pending.body")}
      </p>
      <p className="mt-3 text-xs text-ink-tertiary">
        {t("pending.signedInAs", { email })}
      </p>
      <form action={signOut} className="mt-4">
        <Button type="submit" variant="secondary" className="w-full">
          {t("common.signOut")}
        </Button>
      </form>
    </Card>
  );
}
