import { requireUser } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MembershipSummary } from "@/components/membership/MembershipStatusCard";
import { ProfileView } from "./ProfileView";

const STATUS_RANK = { active: 0, expiring_soon: 1, on_hold: 2, expired: 3 } as const;

export default async function ProfilePage() {
  const profile = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: summaries } = await supabase
    .from("membership_summaries")
    .select("*")
    .eq("member_id", profile.id)
    .order("start_date", { ascending: false });

  const current =
    (summaries ?? [])
      .filter((s) => !s.cancelled_at)
      .sort((a, b) => STATUS_RANK[a.status ?? "expired"] - STATUS_RANK[b.status ?? "expired"])[0] ??
    null;

  const summary: MembershipSummary | null = current
    ? {
        id: current.id!,
        status: current.status ?? "expired",
        plan_type: current.plan_type!,
        name_en: current.plan_name_en,
        name_th: current.plan_name_th,
        end_date: current.end_date,
        visits_remaining: current.visits_remaining,
        upcoming_hold: current.upcoming_hold as MembershipSummary["upcoming_hold"],
      }
    : null;

  return (
    <ProfileView
      userId={profile.id}
      fullName={profile.full_name}
      email={profile.email ?? ""}
      avatarUrl={profile.avatar_url}
      summary={summary}
    />
  );
}
