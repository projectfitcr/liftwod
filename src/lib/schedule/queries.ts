import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionView } from "@/components/schedule/ClassCard";

export type DaySessions = { date: string; sessions: SessionView[] };

/** SessionViews for [from..to] (Bangkok dates), with capacity counts, coach
 *  names, and the viewer's live booking per session. */
export async function getSessionViews(
  from: string,
  to: string,
  userId: string
): Promise<DaySessions[]> {
  const supabase = await createSupabaseServerClient();

  const { data: sessions } = await supabase
    .from("class_sessions")
    .select("id, name, session_date, starts_at, ends_at, status, capacity, coach_id")
    .gte("session_date", from)
    .lte("session_date", to)
    .order("starts_at");

  if (!sessions || sessions.length === 0) return [];
  const ids = sessions.map((s) => s.id);
  const coachIds = [...new Set(sessions.map((s) => s.coach_id).filter(Boolean))] as string[];

  const [{ data: availability }, { data: myBookings }, { data: coaches }, { data: myAttendance }] =
    await Promise.all([
      supabase.from("session_availability").select("*").in("session_id", ids),
      supabase
        .from("bookings")
        .select("id, session_id, status")
        .eq("member_id", userId)
        .in("status", ["booked", "waitlisted"])
        .in("session_id", ids),
      coachIds.length
        ? supabase.from("member_directory").select("id, full_name, nickname").in("id", coachIds)
        : Promise.resolve({ data: [] as { id: string | null; full_name: string | null; nickname: string | null }[] }),
      supabase
        .from("attendance")
        .select("session_id")
        .eq("member_id", userId)
        .in("session_id", ids),
    ]);

  const avail = new Map((availability ?? []).map((a) => [a.session_id, a]));
  const mine = new Map((myBookings ?? []).map((b) => [b.session_id, b]));
  const attended = new Set((myAttendance ?? []).map((a) => a.session_id));
  const coachName = new Map(
    (coaches ?? []).map((c) => [c.id, c.nickname || c.full_name || null])
  );

  const byDate = new Map<string, SessionView[]>();
  for (const s of sessions) {
    const a = avail.get(s.id);
    const b = mine.get(s.id);
    const view: SessionView = {
      id: s.id,
      name: s.name,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      status: s.status,
      coachName: s.coach_id ? (coachName.get(s.coach_id) ?? null) : null,
      capacity: s.capacity,
      booked: Number(a?.booked_count ?? 0),
      waiting: Number(a?.waitlist_count ?? 0),
      myBooking:
        b && (b.status === "booked" || b.status === "waitlisted")
          ? { id: b.id, status: b.status }
          : null,
      checkedIn: attended.has(s.id),
    };
    const list = byDate.get(s.session_date) ?? [];
    list.push(view);
    byDate.set(s.session_date, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({ date, sessions: list }));
}
