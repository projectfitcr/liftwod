import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MembershipSummary } from "@/components/membership/MembershipStatusCard";

const STATUS_RANK = { active: 0, expiring_soon: 1, on_hold: 2, expired: 3 } as const;

/** The member's "current" membership summary: best status first, newest wins. */
export async function getCurrentMembershipSummary(
  memberId: string
): Promise<MembershipSummary | null> {
  const supabase = await createSupabaseServerClient();
  const { data: summaries } = await supabase
    .from("membership_summaries")
    .select("*")
    .eq("member_id", memberId)
    .order("start_date", { ascending: false });

  const current =
    (summaries ?? [])
      .filter((s) => !s.cancelled_at)
      .sort(
        (a, b) =>
          STATUS_RANK[a.status ?? "expired"] - STATUS_RANK[b.status ?? "expired"]
      )[0] ?? null;

  if (!current) return null;
  return {
    id: current.id!,
    status: current.status ?? "expired",
    plan_type: current.plan_type!,
    name_en: current.plan_name_en,
    name_th: current.plan_name_th,
    end_date: current.end_date,
    visits_remaining: current.visits_remaining,
    upcoming_hold: current.upcoming_hold as MembershipSummary["upcoming_hold"],
  };
}
