"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { StaffClassCard } from "@/components/coach/StaffClassCard";
import { Card } from "@/components/ui/Card";
import type { SessionView } from "@/components/schedule/ClassCard";

type AttentionItem = {
  label:
    | "admin.dashboard.pending"
    | "admin.dashboard.renewals"
    | "admin.dashboard.expired"
    | "admin.dashboard.atRisk";
  count: number;
  href: string;
  tone: string;
};

export function AdminDashboard({
  pending,
  renewals,
  expired,
  atRisk,
  sessions,
}: {
  pending: number;
  renewals: number;
  expired: number;
  atRisk: number;
  sessions: SessionView[];
}) {
  const { t } = useLanguage();
  const items: AttentionItem[] = [
    {
      label: "admin.dashboard.pending",
      count: pending,
      href: "/admin/people",
      tone: "text-primary-ink",
    },
    {
      label: "admin.dashboard.renewals",
      count: renewals,
      href: "/admin/people",
      tone: "text-warning-ink",
    },
    {
      label: "admin.dashboard.expired",
      count: expired,
      href: "/admin/people",
      tone: "text-danger-ink",
    },
    {
      label: "admin.dashboard.atRisk",
      count: atRisk,
      href: "/coach/members",
      tone: "text-info-ink",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-ink">
          {t("workspace.admin")}
        </p>
        <h1 className="mt-1 text-2xl font-bold">
          {t("admin.dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-ink-tertiary">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>

      <section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {items.map((item) => (
            <Link key={item.label} href={item.href} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-row-hover">
                <p className={`text-3xl font-bold tabular-nums ${item.tone}`}>
                  {item.count}
                </p>
                <p className="mt-1 text-sm font-medium text-ink-secondary">
                  {t(item.label)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
        {items.every((item) => item.count === 0) ? (
          <p className="mt-3 rounded-xl bg-success-soft px-4 py-3 text-sm text-success-ink">
            {t("admin.dashboard.allClear")}
          </p>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink-secondary">
            {t("admin.dashboard.todayClasses")}
          </h2>
          <Link
            href="/admin/schedule"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-ink hover:underline"
          >
            {t("admin.dashboard.viewAll")} →
          </Link>
        </div>
        {sessions.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sessions.map((session) => (
              <StaffClassCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-ink-tertiary">
              {t("coach.home.noClasses")}
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
