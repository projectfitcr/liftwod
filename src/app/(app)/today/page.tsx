import { requireUser } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionViews } from "@/lib/schedule/queries";
import { getCurrentMembershipSummary } from "@/lib/memberships/queries";
import {
  getMyResults,
  getWodForDate,
  isHiddenFromMembers,
} from "@/lib/wods/queries";
import { bangkokToday } from "@/lib/dates";
import { getBoard } from "@/lib/whiteboard/queries";
import { TodayView } from "./TodayView";

export default async function TodayPage() {
  const profile = await requireUser();
  const supabase = await createSupabaseServerClient();
  const today = bangkokToday();
  const nowIso = new Date().toISOString();

  const [days, summary, wod, board, { data: promotions }] = await Promise.all([
    getSessionViews(today, today, profile.id),
    getCurrentMembershipSummary(profile.id),
    getWodForDate(today),
    getBoard(today),
    supabase
      .from("bookings")
      .select("id, promoted_at, class_sessions(name, starts_at)")
      .eq("member_id", profile.id)
      .eq("status", "booked")
      .not("promoted_at", "is", null)
      .gt("class_sessions.starts_at", new Date().toISOString()),
  ]);

  const myResults = wod
    ? await getMyResults(
        wod.components.map((c) => c.id),
        profile.id,
      )
    : {};

  return (
    <TodayView
      name={profile.nickname || profile.full_name}
      sessions={days[0]?.sessions ?? []}
      membershipStatus={summary?.status ?? null}
      hasMembership={summary != null}
      memberId={profile.id}
      nowIso={nowIso}
      today={today}
      myResults={myResults}
      wod={wod}
      wodHidden={
        profile.role !== "member" && wod ? isHiddenFromMembers(wod) : false
      }
      board={board}
      promotions={(promotions ?? [])
        .filter((p) => p.class_sessions)
        .map((p) => ({ id: p.id, sessionName: p.class_sessions!.name }))}
    />
  );
}
