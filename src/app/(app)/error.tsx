"use client";

import { useEffect } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <p className="text-sm text-danger-ink">{t("common.error")}</p>
      <Button className="mt-4" onClick={reset}>
        {t("common.continue")}
      </Button>
    </Card>
  );
}
