"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { ClassCard, type SessionView } from "@/components/schedule/ClassCard";
import type { MembershipStatus } from "@/components/membership/helpers";
import type { LocaleKey } from "@/lib/i18n";

export function TodayView({
  name,
  sessions,
  membershipStatus,
  hasMembership,
  promotions,
}: {
  name: string;
  sessions: SessionView[];
  membershipStatus: MembershipStatus | null;
  hasMembership: boolean;
  promotions: { id: string; sessionName: string }[];
}) {
  const { t } = useLanguage();
  const membershipProblem =
    !hasMembership || (membershipStatus && membershipStatus !== "active");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t("today.title")}</h1>
        {name ? <p className="text-sm text-ink-tertiary">{name}</p> : null}
      </div>

      {promotions.map((p) => (
        <p
          key={p.id}
          className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink"
        >
          🎉 {t("today.promoted", { name: p.sessionName })}
        </p>
      ))}

      {membershipProblem ? (
        <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning-ink">
          {t("today.membershipIssue", {
            status: membershipStatus
              ? t(`status.${membershipStatus}` as LocaleKey)
              : t("profile.noMembership"),
          })}
        </p>
      ) : null}

      {sessions.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-tertiary">{t("today.noClasses")}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <ClassCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
