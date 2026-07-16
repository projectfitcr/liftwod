import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionViews } from "@/lib/schedule/queries";
import { bangkokToday } from "@/lib/dates";
import { AdminDashboard } from "./AdminDashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminDashboardPage() {
  const profile = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const today = bangkokToday();

  const [
    days,
    pendingResult,
    membershipResult,
    memberResult,
    attendanceResult,
  ] = await Promise.all([
    getSessionViews(today, today, profile.id),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .is("approved_at", null)
      .eq("is_active", true),
    supabase
      .from("membership_summaries")
      .select("id, status, cancelled_at")
      .is("cancelled_at", null),
    supabase
      .from("profiles")
      .select("id")
      .eq("role", "member")
      .not("approved_at", "is", null)
      .eq("is_active", true),
    supabase
      .from("attendance")
      .select("member_id, checked_in_at")
      .order("checked_in_at", { ascending: false })
      .limit(2000),
  ]);

  const lastAttendance = new Map<string, string>();
  for (const row of attendanceResult.data ?? []) {
    if (!lastAttendance.has(row.member_id)) {
      lastAttendance.set(row.member_id, row.checked_in_at);
    }
  }
  const atRiskCutoff = new Date().getTime() - 14 * DAY_MS;
  const atRisk = (memberResult.data ?? []).filter((member) => {
    const last = lastAttendance.get(member.id);
    return !last || new Date(last).getTime() < atRiskCutoff;
  }).length;
  const memberships = membershipResult.data ?? [];

  return (
    <AdminDashboard
      pending={pendingResult.count ?? 0}
      renewals={
        memberships.filter((row) => row.status === "expiring_soon").length
      }
      expired={memberships.filter((row) => row.status === "expired").length}
      atRisk={atRisk}
      sessions={days[0]?.sessions ?? []}
    />
  );
}
