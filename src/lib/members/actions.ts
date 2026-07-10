"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function addNote(memberId: string, body: string) {
  const staff = await requireStaff();
  if (!body.trim()) return { ok: false };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notes").insert({
    member_id: memberId,
    author_id: staff.id,
    body: body.trim(),
  });
  revalidatePath(`/coach/members/${memberId}`);
  return { ok: !error };
}

export async function deleteNote(noteId: string, memberId: string) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  // RLS: author or admin only — others' deletes are silently no-ops.
  await supabase.from("notes").delete().eq("id", noteId);
  revalidatePath(`/coach/members/${memberId}`);
}
