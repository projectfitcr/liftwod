"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
      <h1 className="mb-4 text-lg font-semibold">{t("auth.signIn.title")}</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label={t("auth.password")}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p className="text-sm text-danger-ink">{t("auth.signIn.invalid")}</p>
        ) : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? t("common.loading") : t("auth.signIn.action")}
        </Button>
      </form>
      <div className="mt-4 space-y-1.5 text-sm">
        <p className="text-ink-tertiary">
          {t("auth.signIn.noAccount")}{" "}
          <Link href="/sign-up" className="text-primary-ink hover:underline">
            {t("auth.signIn.signUpLink")}
          </Link>
        </p>
        <p>
          <Link
            href="/reset-password"
            className="text-ink-tertiary hover:text-ink-secondary hover:underline"
          >
            {t("auth.signIn.forgot")}
          </Link>
        </p>
      </div>
    </Card>
  );
}
