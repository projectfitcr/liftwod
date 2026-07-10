"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BookingResult = {
  ok: boolean;
  code: string;
  meta?: Record<string, unknown>;
};

function revalidate() {
  revalidatePath("/schedule");
  revalidatePath("/today");
}

/** All rule enforcement (capacity, membership, weekly limit, waitlist) lives
 *  in the book_class RPC — this is a thin translator. */
export async function bookClass(sessionId: string): Promise<BookingResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("book_class", {
    p_session_id: sessionId,
  });
  revalidate();
  if (error) return { ok: false, code: "NOT_ALLOWED" };
  return data as BookingResult;
}

export async function cancelBooking(bookingId: string): Promise<BookingResult> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });
  revalidate();
  if (error) return { ok: false, code: "NOT_ALLOWED" };
  return data as BookingResult;
}
