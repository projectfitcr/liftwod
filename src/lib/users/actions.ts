"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLanguage } from "@/lib/i18n";

import { revalidatePath } from "next/cache";

/** Called after the browser uploads to the avatars bucket. */
export async function updateAvatarUrl(url: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  if (!uid) return { ok: false };
  if (!url.includes(`/avatars/${uid}.jpg`)) return { ok: false }; // own object only
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", uid);
  revalidatePath("/profile");
  return { ok: !error };
}

/** Persist the language toggle; no-ops when signed out (public pages share
 *  the same provider). Deliberately does not revalidate — the client state
 *  is already correct (see LanguageProvider). */
export async function updatePreferredLanguage(language: string) {
  if (!isLanguage(language)) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  if (!uid) return;
  await supabase
    .from("profiles")
    .update({ preferred_language: language })
    .eq("id", uid);
}
