"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { StaffClassCard } from "@/components/coach/StaffClassCard";
import { Card } from "@/components/ui/Card";
import type { SessionView } from "@/components/schedule/ClassCard";

export function CoachHome({ sessions }: { sessions: SessionView[] }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-ink">
          {t("workspace.coach")}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{t("coach.home.title")}</h1>
        <p className="mt-1 text-sm text-ink-tertiary">
          {t("coach.home.subtitle")}
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink-secondary">
            {t("coach.home.classes")}
          </h2>
          <Link
            href="/coach/classes"
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
