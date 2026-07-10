"use client";

import { useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    setSent(true); // same message either way — don't leak which emails exist
    setBusy(false);
  }

  return (
    <Card>
      <h1 className="mb-4 text-lg font-semibold">{t("auth.reset.title")}</h1>
      {sent ? (
        <p className="text-sm text-success-ink">{t("auth.reset.sent")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field
            label={t("auth.email")}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? t("common.loading") : t("auth.reset.action")}
          </Button>
        </form>
      )}
    </Card>
  );
}
