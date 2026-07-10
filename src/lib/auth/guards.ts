import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Per-request memoized session + profile lookup. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  if (!uid) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .single();
  return profile ?? null;
});

/** Signed-in AND approved; pending accounts land on /pending. */
export async function requireUser(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.approved_at || !profile.is_active) redirect("/pending");
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== "admin" && profile.role !== "coach") notFound();
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== "admin") notFound();
  return profile;
}
