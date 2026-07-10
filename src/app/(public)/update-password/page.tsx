"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(true);
      setBusy(false);
      return;
    }
    router.push("/today");
    router.refresh();
  }

  return (
    <Card>
      <h1 className="mb-4 text-lg font-semibold">{t("auth.update.title")}</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field
          label={t("auth.password")}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint={t("auth.signUp.passwordHint")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p className="text-sm text-danger-ink">{t("common.error")}</p>
        ) : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? t("common.loading") : t("auth.update.action")}
        </Button>
      </form>
    </Card>
  );
}
