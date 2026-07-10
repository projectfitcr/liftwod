import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMembershipSummary } from "@/lib/memberships/queries";
import { MemberDetail } from "./MemberDetail";

export default async function CoachMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: member } = await supabase
    .from("profiles")
    .select("id, full_name, nickname, email, phone, avatar_url")
    .eq("id", id)
    .single();
  if (!member) notFound();

  const [summary, { data: attendance }, { data: notes }, { data: authors }] =
    await Promise.all([
      getCurrentMembershipSummary(id),
      supabase
        .from("attendance")
        .select("id, checked_in_at, class_sessions(name, session_date, starts_at)")
        .eq("member_id", id)
        .order("checked_in_at", { ascending: false })
        .limit(50),
      supabase
        .from("notes")
        .select("*")
        .eq("member_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("member_directory").select("id, full_name, nickname"),
    ]);

  const authorName = new Map(
    (authors ?? []).map((a) => [a.id, a.nickname || a.full_name || "—"])
  );

  return (
    <MemberDetail
      member={{
        id: member.id,
        name: member.nickname || member.full_name || member.email || "—",
        email: member.email,
        avatarUrl: member.avatar_url,
      }}
      summary={summary}
      attendance={(attendance ?? []).map((a) => ({
        id: a.id,
        checkedInAt: a.checked_in_at,
        sessionName: a.class_sessions?.name ?? "—",
        sessionDate: a.class_sessions?.session_date ?? null,
      }))}
      notes={(notes ?? []).map((n) => ({
        id: n.id,
        body: n.body,
        createdAt: n.created_at,
        author: authorName.get(n.author_id) ?? "—",
        mine: n.author_id === staff.id,
      }))}
      isAdmin={staff.role === "admin"}
    />
  );
}
