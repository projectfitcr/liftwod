"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatDate } from "@/lib/format";
import {
  approveUser,
  createInvite,
  deleteInvite,
  setUserActive,
  setUserRole,
} from "@/lib/admin/actions";

type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  role: "admin" | "coach" | "member";
  approved_at: string | null;
  is_active: boolean;
  created_at: string;
};

type InviteRow = {
  token: string;
  role: "admin" | "coach" | "member";
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

const ROLE_KEY = {
  admin: "admin.users.role.admin",
  coach: "admin.users.role.coach",
  member: "admin.users.role.member",
} as const;

export function UsersAdmin({
  profiles,
  invites,
}: {
  profiles: ProfileRow[];
  invites: InviteRow[];
}) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  const waiting = profiles.filter((p) => !p.approved_at && p.is_active);
  const rest = profiles.filter((p) => p.approved_at || !p.is_active);

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/sign-up?invite=${token}`;
    void navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">{t("admin.users.title")}</h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("admin.users.pending")}
        </h2>
        {waiting.length === 0 ? (
          <Card>
            <p className="text-sm text-ink-tertiary">{t("admin.users.noPending")}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {waiting.map((p) => (
              <Card key={p.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">
                    {p.full_name || p.email}
                  </p>
                  <p className="break-words text-xs text-ink-tertiary">
                    {p.email} ·{" "}
                    {t("admin.users.joined", {
                      date: formatDate(language, p.created_at),
                    })}
                  </p>
                </div>
                <Button
                  disabled={pending}
                  onClick={() => startTransition(() => approveUser(p.id).then(() => {}))}
                >
                  {t("admin.users.approve")}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("admin.invites.title")}
        </h2>
        <Card className="space-y-3">
          <p className="text-xs text-ink-tertiary">{t("admin.invites.explainer")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => startTransition(() => createInvite("member").then(() => {}))}
            >
              {t("admin.invites.create")} — {t("admin.invites.forMember")}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => startTransition(() => createInvite("coach").then(() => {}))}
            >
              {t("admin.invites.create")} — {t("admin.invites.forCoach")}
            </Button>
          </div>
          {invites.length === 0 ? (
            <p className="text-sm text-ink-tertiary">{t("admin.invites.none")}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {invites.map((inv) => (
                <li key={inv.token} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Pill tone={inv.role === "coach" ? "info" : "primary"}>
                      {t(ROLE_KEY[inv.role])}
                    </Pill>
                    <span className="whitespace-nowrap text-xs text-ink-tertiary">
                      {t("admin.invites.expires", {
                        date: formatDate(language, inv.expires_at),
                      })}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button variant="secondary" onClick={() => copyInviteLink(inv.token)}>
                      {copied === inv.token
                        ? t("admin.invites.copied")
                        : t("admin.invites.copy")}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={pending}
                      onClick={() => startTransition(() => deleteInvite(inv.token))}
                    >
                      ✕
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("admin.users.everyone")}
        </h2>
        <Card>
          <ul className="divide-y divide-hairline">
            {rest.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">
                    {p.full_name || p.email}
                    {!p.is_active ? (
                      <span className="ml-2 align-middle">
                        <Pill tone="danger">{t("admin.users.inactive")}</Pill>
                      </span>
                    ) : null}
                  </p>
                  <p className="break-words text-xs text-ink-tertiary">{p.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Pill
                    tone={
                      p.role === "admin" ? "accent" : p.role === "coach" ? "info" : "neutral"
                    }
                  >
                    {t(ROLE_KEY[p.role])}
                  </Pill>
                  {p.role !== "admin" ? (
                    <>
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            setUserRole(
                              p.id,
                              p.role === "coach" ? "member" : "coach"
                            ).then(() => {})
                          )
                        }
                      >
                        {p.role === "coach"
                          ? t("admin.users.makeMember")
                          : t("admin.users.makeCoach")}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            setUserActive(p.id, !p.is_active).then(() => {})
                          )
                        }
                      >
                        {p.is_active
                          ? t("admin.users.deactivate")
                          : t("admin.users.reactivate")}
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
