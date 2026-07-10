"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLanguage } from "@/lib/i18n";

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
