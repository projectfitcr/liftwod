"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ScoreValues = {
  timeSeconds?: number;
  rounds?: number;
  reps?: number;
  loadKg?: number;
  distanceM?: number;
  calories?: number;
};

/**
 * Upsert a result (unique component_id+member_id — re-logging edits). Goes
 * through user-context RLS: members can only write their own rows, staff any.
 * The BEFORE trigger validates the score shape and computes is_pr; the AFTER
 * trigger maintains prs. session_id is attributed from the member's
 * attendance that day — no attendance means open gym (flagged on the board).
 */
export async function logResult(input: {
  componentId: string;
  memberId?: string; // staff on-behalf; defaults to self
  date: string; // the WOD's date, for session attribution + revalidate
  isRx: boolean;
  comment?: string;
  values: ScoreValues;
}): Promise<{ ok: boolean; isPr: boolean }> {
  const user = await requireUser();
  const memberId = input.memberId ?? user.id;
  const supabase = await createSupabaseServerClient();

  const { data: att } = await supabase
    .from("attendance")
    .select("session_id, class_sessions!inner(session_date)")
    .eq("member_id", memberId)
    .eq("class_sessions.session_date", input.date)
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("results")
    .upsert(
      {
        component_id: input.componentId,
        member_id: memberId,
        // Placeholder: the BEFORE trigger denormalizes the real score_type
        // from the component before validation.
        score_type: "none",
        session_id: att?.session_id ?? null,
        is_rx: input.isRx,
        comment: input.comment || null,
        entered_by: memberId !== user.id ? user.id : null,
        time_seconds: input.values.timeSeconds ?? null,
        rounds: input.values.rounds ?? null,
        reps: input.values.reps ?? null,
        load_kg: input.values.loadKg ?? null,
        distance_m: input.values.distanceM ?? null,
        calories: input.values.calories ?? null,
      },
      { onConflict: "component_id,member_id" }
    )
    .select("is_pr")
    .single();

  revalidatePath("/today");
  revalidatePath(`/wod/${input.date}`);
  revalidatePath("/whiteboard");
  revalidatePath("/results");

  return { ok: !error, isPr: data?.is_pr ?? false };
}
