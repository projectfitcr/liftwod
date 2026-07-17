import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PeopleAdmin } from "./PeopleAdmin";

export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string; membership?: string }>;
}) {
  await requireAdmin();
  const { person, membership } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [
    { data: profiles },
    { data: invites },
    { data: memberships },
    { data: plans },
    { data: payments },
    { data: holds },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, nickname, email, role, approved_at, is_active, created_at, avatar_url",
      )
      .order("full_name"),
    supabase
      .from("invites")
      .select("token, role, expires_at, used_at, created_at")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("membership_summaries")
      .select("*")
      .order("start_date", { ascending: false }),
    supabase
      .from("membership_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("payments").select("*").order("paid_on", { ascending: false }),
    supabase.from("holds").select("*").order("starts_on", { ascending: false }),
  ]);

  const selectedMembership = (memberships ?? []).find((item) => item.id === membership);

  return (
    <PeopleAdmin
      profiles={profiles ?? []}
      invites={invites ?? []}
      memberships={memberships ?? []}
      plans={plans ?? []}
      payments={payments ?? []}
      holds={holds ?? []}
      initialPersonId={person ?? selectedMembership?.member_id ?? undefined}
      initialMembershipId={membership}
    />
  );
}
