import { requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MembersList } from "./MembersList";

export default async function CoachMembersPage() {
  await requireStaff();
  const supabase = await createSupabaseServerClient();

  const [{ data: people }, { data: lastAttendance }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, nickname, email, role")
      .not("approved_at", "is", null)
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("attendance")
      .select("member_id, checked_in_at")
      .order("checked_in_at", { ascending: false })
      .limit(2000),
  ]);

  const last = new Map<string, string>();
  for (const a of lastAttendance ?? []) {
    if (!last.has(a.member_id)) last.set(a.member_id, a.checked_in_at);
  }

  const rows = (people ?? []).map((p) => ({
    id: p.id,
    name: p.nickname || p.full_name || p.email || "—",
    role: p.role,
    lastAttended: last.get(p.id) ?? null,
  }));

  // Longest-away first: the retention list IS the sort order (PRD goal 4).
  rows.sort((a, b) => {
    if (!a.lastAttended && !b.lastAttended) return a.name.localeCompare(b.name);
    if (!a.lastAttended) return -1;
    if (!b.lastAttended) return 1;
    return a.lastAttended.localeCompare(b.lastAttended);
  });

  return <MembersList rows={rows} />;
}
