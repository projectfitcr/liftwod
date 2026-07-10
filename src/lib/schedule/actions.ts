"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function revalidate() {
  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  revalidatePath("/today");
}

/** generate_sessions is EXECUTE-revoked for authenticated (cron/service only),
 *  so the synchronous after-save generation goes through the admin client.
 *  Guarded by requireStaff first. */
async function generateNow() {
  const admin = createSupabaseAdminClient();
  await admin.rpc("generate_sessions");
}

export async function createTemplate(input: {
  name: string;
  days: number[]; // ISO 1–7, one template row per day
  startTime: string; // "HH:MM"
  durationMinutes: number;
  capacity: number;
  coachId?: string;
}) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();

  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .single();
  if (!location) return { ok: false };

  const rows = input.days.map((day) => ({
    location_id: location.id,
    name: input.name,
    day_of_week: day,
    start_time: input.startTime,
    duration_minutes: input.durationMinutes,
    capacity: input.capacity,
    coach_id: input.coachId || null,
  }));
  const { error } = await supabase.from("class_templates").insert(rows);
  if (!error) await generateNow();
  revalidate();
  return { ok: !error };
}

export async function setTemplateActive(templateId: string, isActive: boolean) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("class_templates")
    .update({ is_active: isActive })
    .eq("id", templateId);
  if (isActive) await generateNow();
  revalidate();
}

export async function updateSessionCapacity(sessionId: string, capacity: number) {
  await requireStaff();
  if (!Number.isInteger(capacity) || capacity < 1) return { ok: false };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("class_sessions")
    .update({ capacity })
    .eq("id", sessionId);
  revalidate();
  return { ok: !error };
}

export async function cancelSession(sessionId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("class_sessions")
    .update({ status: "cancelled" })
    .eq("id", sessionId);
  revalidate();
}
