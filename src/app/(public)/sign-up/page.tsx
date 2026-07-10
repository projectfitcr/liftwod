"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function SignUpForm() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          preferred_language: language,
          ...(invite ? { invite_token: invite } : {}),
        },
      },
    });
    if (error) {
      setError(true);
      setBusy(false);
      return;
    }
    router.push("/today"); // pending accounts get bounced to /pending by the guard
    router.refresh();
  }

  return (
    <Card>
      <h1 className="mb-1 text-lg font-semibold">{t("auth.signUp.title")}</h1>
      {invite ? (
        <p className="mb-3 rounded-lg bg-success-soft px-3 py-2 text-sm text-success-ink">
          {t("auth.signUp.invited")}
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <Field
          label={t("auth.fullName")}
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          hint={t("auth.signUp.passwordHint")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p className="text-sm text-danger-ink">{t("auth.signUp.failed")}</p>
        ) : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? t("common.loading") : t("auth.signUp.action")}
        </Button>
      </form>
      <p className="mt-4 text-sm text-ink-tertiary">
        {t("auth.signUp.haveAccount")}{" "}
        <Link href="/sign-in" className="text-primary-ink hover:underline">
          {t("auth.signUp.signInLink")}
        </Link>
      </p>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
