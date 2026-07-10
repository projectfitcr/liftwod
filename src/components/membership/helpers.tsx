"use client";

import { Pill } from "@/components/ui/Pill";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

export type MembershipStatus = Database["public"]["Enums"]["membership_status"];
export type PlanType = Database["public"]["Enums"]["plan_type"];

const STATUS_TONE: Record<MembershipStatus, "success" | "warning" | "danger" | "info"> = {
  active: "success",
  expiring_soon: "warning",
  expired: "danger",
  on_hold: "info",
};

export function StatusPill({ status }: { status: MembershipStatus }) {
  const { t } = useLanguage();
  return <Pill tone={STATUS_TONE[status]}>{t(`status.${status}` as LocaleKey)}</Pill>;
}

/** "Max 3 visits per week (Mon–Sun) for 1 month(s)" — bilingual plan rule line. */
export function PlanRule({
  plan,
}: {
  plan: {
    plan_type: PlanType;
    duration_months: number | null;
    weekly_visit_limit: number | null;
    visit_count: number | null;
  };
}) {
  const { t } = useLanguage();
  const text =
    plan.plan_type === "unlimited"
      ? t("plan.rule.unlimited", { months: plan.duration_months ?? 1 })
      : plan.plan_type === "weekly_limited"
        ? t("plan.rule.weekly_limited", {
            limit: plan.weekly_visit_limit ?? 0,
            months: plan.duration_months ?? 1,
          })
        : plan.plan_type === "visit_pack"
          ? t("plan.rule.visit_pack", { count: plan.visit_count ?? 0 })
          : t("plan.rule.drop_in");
  return <span className="break-words text-xs text-ink-tertiary">{text}</span>;
}

export function planName(
  language: "en" | "th",
  plan: { name_en: string | null; name_th: string | null }
): string {
  return (language === "th" ? plan.name_th : plan.name_en) || plan.name_en || "—";
}
