import { requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WodsList } from "./WodsList";

export default async function CoachWodsPage() {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, title, scheduled_on, published, reveal_at, benchmarks(name)")
    .order("scheduled_on", { ascending: false, nullsFirst: true })
    .limit(60);

  return (
    <WodsList
      workouts={(workouts ?? []).map((w) => ({
        id: w.id,
        title: w.title,
        scheduledOn: w.scheduled_on,
        published: w.published,
        benchmarkName: w.benchmarks?.name ?? null,
      }))}
    />
  );
}
