import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClassRoster } from "./ClassRoster";

export default async function CoachClassPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await requireStaff();
  const { sessionId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (!session) notFound();

  const [{ data: bookings }, { data: attendance }, { data: people }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id, member_id, status, booked_at")
        .eq("session_id", sessionId)
        .in("status", ["booked", "waitlisted"])
        .order("booked_at"),
      supabase
        .from("attendance")
        .select("id, member_id, booking_id, checked_in_at")
        .eq("session_id", sessionId),
      supabase
        .from("profiles")
        .select("id, full_name, nickname, email")
        .not("approved_at", "is", null)
        .eq("is_active", true)
        .order("full_name"),
    ]);

  const names = new Map(
    (people ?? []).map((p) => [p.id, p.nickname || p.full_name || p.email || "—"])
  );
  const attByMember = new Map((attendance ?? []).map((a) => [a.member_id, a]));

  const roster = (bookings ?? []).map((b) => ({
    bookingId: b.id,
    memberId: b.member_id,
    name: names.get(b.member_id) ?? "—",
    status: b.status as "booked" | "waitlisted",
    attendanceId: attByMember.get(b.member_id)?.id ?? null,
  }));

  // Walk-ins: attendance without a live booking on this session
  const bookedMemberIds = new Set(roster.map((r) => r.memberId));
  const walkIns = (attendance ?? [])
    .filter((a) => !bookedMemberIds.has(a.member_id))
    .map((a) => ({
      memberId: a.member_id,
      name: names.get(a.member_id) ?? "—",
      attendanceId: a.id,
    }));

  const rosterIds = new Set([...bookedMemberIds, ...walkIns.map((w) => w.memberId)]);
  const addable = (people ?? [])
    .filter((p) => !rosterIds.has(p.id))
    .map((p) => ({ id: p.id, name: names.get(p.id) ?? "—" }));

  return (
    <ClassRoster
      session={{
        id: session.id,
        name: session.name,
        date: session.session_date,
        startsAt: session.starts_at,
        status: session.status,
        capacity: session.capacity,
      }}
      roster={roster}
      walkIns={walkIns}
      addable={addable}
    />
  );
}
