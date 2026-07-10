import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WodBuilder } from "./WodBuilder";

export default async function WodBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: workout }, { data: benchmarks }, { data: exercises }] =
    await Promise.all([
      supabase
        .from("workouts")
        .select(
          `*, workout_components(
            id, kind, title, description, score_type, position,
            workout_component_exercises(exercise_id)
          )`
        )
        .eq("id", id)
        .single(),
      supabase.from("benchmarks").select("id, name").order("name"),
      supabase
        .from("exercises")
        .select("id, name_en, name_th")
        .eq("is_active", true)
        .order("name_en"),
    ]);
  if (!workout) notFound();

  const editorName = workout.updated_by
    ? (
        await supabase
          .from("member_directory")
          .select("full_name, nickname")
          .eq("id", workout.updated_by)
          .maybeSingle()
      ).data
    : null;

  const componentKey = (workout.workout_components ?? [])
    .map((c) => c.id)
    .sort()
    .join(",");

  return (
    <WodBuilder
      key={componentKey}
      workout={{
        id: workout.id,
        title: workout.title,
        scheduledOn: workout.scheduled_on,
        benchmarkId: workout.benchmark_id,
        coachNotes: workout.coach_notes ?? "",
        published: workout.published,
        revealAt: workout.reveal_at,
        updatedAt: workout.updated_at,
        editorName: editorName?.nickname || editorName?.full_name || null,
        components: (workout.workout_components ?? [])
          .sort((a, b) => a.position - b.position)
          .map((c) => ({
            id: c.id,
            kind: c.kind,
            title: c.title ?? "",
            description: c.description,
            scoreType: c.score_type,
            exerciseIds: c.workout_component_exercises.map((e) => e.exercise_id),
          })),
      }}
      benchmarks={benchmarks ?? []}
      exercises={exercises ?? []}
    />
  );
}
