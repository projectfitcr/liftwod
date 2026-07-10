import { requireUser } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResultsView } from "./ResultsView";

export default async function ResultsPage() {
  const profile = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: prs }, { data: history }] = await Promise.all([
    supabase
      .from("prs")
      .select(
        "id, kind, score_type, is_rx, value, achieved_on, benchmarks(name), exercises(name_en, name_th)"
      )
      .eq("member_id", profile.id)
      .order("achieved_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("results")
      .select(
        `id, is_rx, is_pr, comment, created_at,
         score_type, time_seconds, rounds, reps, load_kg, distance_m, calories,
         workout_components(kind, title, workouts(title, scheduled_on, benchmarks(name)))`
      )
      .eq("member_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Current best per PR lane: first (latest) row per lane key wins.
  const seen = new Set<string>();
  const bestPrs = (prs ?? []).filter((p) => {
    const key = `${p.kind}:${p.benchmarks?.name ?? ""}:${p.exercises?.name_en ?? ""}:${p.score_type}:${p.is_rx}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <ResultsView
      prs={bestPrs.map((p) => ({
        id: p.id,
        kind: p.kind,
        scoreType: p.score_type,
        isRx: p.is_rx,
        value: Number(p.value),
        achievedOn: p.achieved_on,
        benchmarkName: p.benchmarks?.name ?? null,
        exercise: p.exercises
          ? { name_en: p.exercises.name_en, name_th: p.exercises.name_th }
          : null,
      }))}
      history={(history ?? []).map((r) => ({
        id: r.id,
        isRx: r.is_rx,
        isPr: r.is_pr,
        comment: r.comment,
        createdAt: r.created_at,
        scoreType: r.score_type,
        time_seconds: r.time_seconds,
        rounds: r.rounds,
        reps: r.reps,
        load_kg: r.load_kg != null ? Number(r.load_kg) : null,
        distance_m: r.distance_m != null ? Number(r.distance_m) : null,
        calories: r.calories,
        workoutTitle: r.workout_components?.workouts?.title ?? "—",
        workoutDate: r.workout_components?.workouts?.scheduled_on ?? null,
        benchmarkName: r.workout_components?.workouts?.benchmarks?.name ?? null,
      }))}
    />
  );
}
