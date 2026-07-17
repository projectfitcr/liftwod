"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// All of these run user-context through RLS (admin policies + the profiles
// integrity trigger) — real audit trails, no service key in request paths.

function revalidateAdminPeople() {
  revalidatePath("/admin/people");
  revalidatePath("/admin/users");
}

export async function approveUser(userId: string) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ approved_at: new Date().toISOString(), approved_by: admin.id })
    .eq("id", userId);
  revalidateAdminPeople();
  return { ok: !error };
}

export async function setUserRole(
  userId: string,
  role: "member" | "coach" | "admin"
) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  revalidateAdminPeople();
  return {
    ok: !error,
    code: error?.message.includes("LAST_ADMIN") ? "LAST_ADMIN" : undefined,
  };
}

export async function setUserActive(userId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);
  revalidateAdminPeople();
  return {
    ok: !error,
    code: error?.message.includes("LAST_ADMIN") ? "LAST_ADMIN" : undefined,
  };
}

export async function createInvite(role: "member" | "coach") {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invites")
    .insert({ role, created_by: admin.id })
    .select("token")
    .single();
  revalidateAdminPeople();
  return { ok: !error, token: data?.token };
}

export async function deleteInvite(token: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  await supabase.from("invites").delete().eq("token", token);
  revalidateAdminPeople();
}
