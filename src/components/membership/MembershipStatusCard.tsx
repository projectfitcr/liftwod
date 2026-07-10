"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { StatusPill, planName, type MembershipStatus, type PlanType } from "@/components/membership/helpers";
import { formatDate, formatNumber } from "@/lib/format";

export type MembershipSummary = {
  id: string;
  status: MembershipStatus;
  plan_type: PlanType;
  name_en: string | null;
  name_th: string | null;
  end_date: string | null;
  visits_remaining: number | null;
  upcoming_hold: { starts_on: string; ends_on: string } | null;
};

/** The member-facing membership card (profile; later: today-page banner). */
export function MembershipStatusCard({
  summary,
}: {
  summary: MembershipSummary | null;
}) {
  const { t, language } = useLanguage();

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("profile.membership")}</p>
        {summary ? <StatusPill status={summary.status} /> : null}
      </div>

      {!summary ? (
        <p className="text-sm text-ink-tertiary">{t("profile.noMembership")}</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-ink-tertiary">{t("profile.plan")}</span>
            <span className="break-words text-sm">
              {planName(language, summary)}
            </span>
          </div>
          {summary.end_date ? (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-ink-tertiary">{t("profile.validUntil")}</span>
              <span className="whitespace-nowrap text-sm">
                {formatDate(language, summary.end_date)}
              </span>
            </div>
          ) : null}
          {summary.visits_remaining != null ? (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-ink-tertiary">{t("profile.visitsRemaining")}</span>
              <span className="whitespace-nowrap text-sm font-semibold">
                {formatNumber(language, summary.visits_remaining)}
              </span>
            </div>
          ) : null}
          {summary.upcoming_hold ? (
            <p className="rounded-lg bg-info-soft px-3 py-2 text-xs text-info-ink">
              {t("profile.onHoldUntil", {
                from: formatDate(language, summary.upcoming_hold.starts_on),
                to: formatDate(language, summary.upcoming_hold.ends_on),
              })}
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}
