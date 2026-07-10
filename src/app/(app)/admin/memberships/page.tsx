import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MembershipsAdmin } from "./MembershipsAdmin";

export default async function AdminMembershipsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [{ data: summaries }, { data: people }, { data: plans }] = await Promise.all([
    supabase
      .from("membership_summaries")
      .select("*")
      .order("start_date", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, nickname, email")
      .not("approved_at", "is", null)
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("membership_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const names = new Map((people ?? []).map((p) => [p.id, p.full_name || p.email || "—"]));
  const rows = (summaries ?? []).map((s) => ({
    ...s,
    member_name: names.get(s.member_id ?? "") ?? "—",
  }));

  return <MembershipsAdmin rows={rows} people={people ?? []} plans={plans ?? []} />;
}
