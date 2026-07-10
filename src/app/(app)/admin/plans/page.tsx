import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PlansAdmin } from "./PlansAdmin";

export default async function AdminPlansPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: plans } = await supabase
    .from("membership_plans")
    .select("*")
    .order("sort_order")
    .order("created_at");

  return <PlansAdmin plans={plans ?? []} />;
}
