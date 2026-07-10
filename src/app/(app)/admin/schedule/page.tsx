import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addDays, bangkokToday } from "@/lib/dates";
import { ScheduleAdmin } from "./ScheduleAdmin";

export default async function AdminSchedulePage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const today = bangkokToday();

  const [{ data: templates }, { data: sessions }, { data: staff }, { data: availability }] =
    await Promise.all([
      supabase
        .from("class_templates")
        .select("*")
        .order("day_of_week")
        .order("start_time"),
      supabase
        .from("class_sessions")
        .select("*")
        .gte("session_date", today)
        .lte("session_date", addDays(today, 13))
        .order("starts_at"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["coach", "admin"])
        .eq("is_active", true)
        .order("full_name"),
      supabase.from("session_availability").select("*"),
    ]);

  const avail = new Map((availability ?? []).map((a) => [a.session_id, a]));
  const sessionRows = (sessions ?? []).map((s) => ({
    ...s,
    booked: Number(avail.get(s.id)?.booked_count ?? 0),
    waiting: Number(avail.get(s.id)?.waitlist_count ?? 0),
  }));

  return (
    <ScheduleAdmin
      templates={templates ?? []}
      sessions={sessionRows}
      staff={staff ?? []}
    />
  );
}
