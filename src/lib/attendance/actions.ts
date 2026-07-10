"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireUser } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingResult } from "@/lib/bookings/actions";

function revalidate(sessionId?: string) {
  revalidatePath("/today");
  if (sessionId) revalidatePath(`/coach/class/${sessionId}`);
}

/** Self check-in (window-gated in the RPC) or staff on-behalf. Punch-card
 *  depletion happens inside check_in, exactly-once. */
export async function checkIn(
  sessionId: string,
  memberId?: string
): Promise<BookingResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("check_in", {
    p_session_id: sessionId,
    p_member_id: memberId,
  });
  revalidate(sessionId);
  if (error) return { ok: false, code: "NOT_ALLOWED" };
  return data as BookingResult;
}

export async function undoCheckIn(
  attendanceId: string,
  sessionId: string
): Promise<BookingResult> {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("undo_check_in", {
    p_attendance_id: attendanceId,
  });
  revalidate(sessionId);
  if (error) return { ok: false, code: "NOT_ALLOWED" };
  return data as BookingResult;
}
