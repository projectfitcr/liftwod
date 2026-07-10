import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UsersAdmin } from "./UsersAdmin";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [{ data: profiles }, { data: invites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, approved_at, is_active, created_at, avatar_url")
      .order("created_at", { ascending: false }),
    supabase
      .from("invites")
      .select("token, role, expires_at, used_at, created_at")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  return <UsersAdmin profiles={profiles ?? []} invites={invites ?? []} />;
}
