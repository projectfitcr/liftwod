import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WodView } from "@/components/wod/WodCard";

/** The WOD for a date, shaped for WodCard. RLS already hides unpublished /
 *  unrevealed workouts from members — a null here means "nothing you may
 *  see". Staff callers get hidden ones too (flag computed by caller). */
export async function getWodForDate(date: string): Promise<WodView | null> {
  const supabase = await createSupabaseServerClient();
  const { data: workout } = await supabase
    .from("workouts")
    .select(
      `id, title, coach_notes, published, reveal_at,
       benchmarks(name),
       workout_components(
         id, kind, title, description, score_type, position,
         workout_component_exercises(
           position,
           exercises(id, name_en, name_th, demo_url)
         )
       )`
    )
    .eq("scheduled_on", date)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!workout) return null;

  return {
    id: workout.id,
    title: workout.title,
    benchmarkName: workout.benchmarks?.name ?? null,
    coachNotes: workout.coach_notes,
    published: workout.published,
    revealAt: workout.reveal_at,
    components: (workout.workout_components ?? [])
      .sort((a, b) => a.position - b.position)
      .map((c) => ({
        id: c.id,
        kind: c.kind,
        title: c.title,
        description: c.description,
        scoreType: c.score_type,
        exercises: (c.workout_component_exercises ?? [])
          .sort((a, b) => a.position - b.position)
          .map((e) => e.exercises)
          .filter((e): e is NonNullable<typeof e> => e != null),
      })),
  };
}

export type MyResultRow = {
  is_rx: boolean;
  is_pr: boolean;
  comment: string | null;
  time_seconds: number | null;
  rounds: number | null;
  reps: number | null;
  load_kg: number | null;
  distance_m: number | null;
  calories: number | null;
};

/** The viewer's results for a set of components, keyed by component id. */
export async function getMyResults(
  componentIds: string[],
  memberId: string
): Promise<Partial<Record<string, MyResultRow>>> {
  if (componentIds.length === 0) return {};
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("results")
    .select(
      "component_id, is_rx, is_pr, comment, time_seconds, rounds, reps, load_kg, distance_m, calories"
    )
    .eq("member_id", memberId)
    .in("component_id", componentIds);

  const map: Partial<Record<string, MyResultRow>> = {};
  for (const r of data ?? []) {
    map[r.component_id] = {
      ...r,
      load_kg: r.load_kg != null ? Number(r.load_kg) : null,
      distance_m: r.distance_m != null ? Number(r.distance_m) : null,
    };
  }
  return map;
}

export function isHiddenFromMembers(wod: WodView): boolean {
  return (
    !wod.published ||
    (wod.revealAt != null && new Date(wod.revealAt).getTime() > Date.now())
  );
}
