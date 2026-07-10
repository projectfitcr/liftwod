"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ComponentKind = Database["public"]["Enums"]["component_kind"];
type ScoreType = Database["public"]["Enums"]["score_type"];
type ExerciseCategory = Database["public"]["Enums"]["exercise_category"];

function revalidate(workoutId?: string, date?: string | null) {
  revalidatePath("/coach/wods");
  if (workoutId) revalidatePath(`/coach/wods/${workoutId}`);
  revalidatePath("/today");
  if (date) revalidatePath(`/wod/${date}`);
}

export async function createWorkout() {
  const staff = await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workouts")
    .insert({ title: "WOD", created_by: staff.id, updated_by: staff.id })
    .select("id")
    .single();
  if (error || !data) return;
  revalidate(data.id);
  redirect(`/coach/wods/${data.id}`);
}

export async function saveWorkout(
  workoutId: string,
  input: {
    title: string;
    scheduledOn: string | null;
    benchmarkId: string | null;
    coachNotes: string;
    published: boolean;
    revealAt: string | null; // ISO or null
  }
) {
  const staff = await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("workouts")
    .update({
      title: input.title || "WOD",
      scheduled_on: input.scheduledOn,
      benchmark_id: input.benchmarkId,
      coach_notes: input.coachNotes || null,
      published: input.published,
      reveal_at: input.revealAt,
      updated_by: staff.id, // the "last edited by" stamp (last save wins)
    })
    .eq("id", workoutId);
  revalidate(workoutId, input.scheduledOn);
  return { ok: !error };
}

export async function deleteWorkout(workoutId: string) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  await supabase.from("workouts").delete().eq("id", workoutId);
  revalidate();
  redirect("/coach/wods");
}

/** Copy-forward: duplicate a workout (components + exercise links) as an
 *  unscheduled draft, then jump into the builder. */
export async function copyWorkout(workoutId: string) {
  const staff = await requireStaff();
  const supabase = await createSupabaseServerClient();

  const [{ data: src }, { data: components }] = await Promise.all([
    supabase.from("workouts").select("*").eq("id", workoutId).single(),
    supabase
      .from("workout_components")
      .select("*, workout_component_exercises(exercise_id, position)")
      .eq("workout_id", workoutId)
      .order("position"),
  ]);
  if (!src) return;

  const { data: copy, error } = await supabase
    .from("workouts")
    .insert({
      title: src.title,
      benchmark_id: src.benchmark_id,
      coach_notes: src.coach_notes,
      published: false,
      created_by: staff.id,
      updated_by: staff.id,
    })
    .select("id")
    .single();
  if (error || !copy) return;

  for (const c of components ?? []) {
    const { data: newComp } = await supabase
      .from("workout_components")
      .insert({
        workout_id: copy.id,
        position: c.position,
        kind: c.kind,
        title: c.title,
        description: c.description,
        score_type: c.score_type,
      })
      .select("id")
      .single();
    if (newComp && c.workout_component_exercises.length) {
      await supabase.from("workout_component_exercises").insert(
        c.workout_component_exercises.map((e) => ({
          component_id: newComp.id,
          exercise_id: e.exercise_id,
          position: e.position,
        }))
      );
    }
  }

  revalidate(copy.id);
  redirect(`/coach/wods/${copy.id}`);
}

export async function addComponent(workoutId: string) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("workout_components")
    .select("id", { count: "exact", head: true })
    .eq("workout_id", workoutId);
  await supabase.from("workout_components").insert({
    workout_id: workoutId,
    position: (count ?? 0) + 1,
    kind: "metcon",
    score_type: "none",
    description: "",
  });
  revalidate(workoutId);
}

export async function updateComponent(
  componentId: string,
  workoutId: string,
  input: { kind: ComponentKind; scoreType: ScoreType; title: string; description: string }
) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("workout_components")
    .update({
      kind: input.kind,
      score_type: input.scoreType,
      title: input.title || null,
      description: input.description,
    })
    .eq("id", componentId);
  revalidate(workoutId);
  return { ok: !error };
}

export async function deleteComponent(componentId: string, workoutId: string) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  await supabase.from("workout_components").delete().eq("id", componentId);
  revalidate(workoutId);
}

export async function addComponentExercise(
  componentId: string,
  workoutId: string,
  exerciseId: string
) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("workout_component_exercises")
    .upsert({ component_id: componentId, exercise_id: exerciseId });
  revalidate(workoutId);
}

export async function removeComponentExercise(
  componentId: string,
  workoutId: string,
  exerciseId: string
) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("workout_component_exercises")
    .delete()
    .eq("component_id", componentId)
    .eq("exercise_id", exerciseId);
  revalidate(workoutId);
}

// ---- Exercise library ----

export async function createExercise(input: {
  nameEn: string;
  nameTh: string;
  category: ExerciseCategory;
  demoUrl: string;
  isTrackedLift: boolean;
}) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("exercises").insert({
    name_en: input.nameEn,
    name_th: input.nameTh || null,
    category: input.category,
    demo_url: input.demoUrl || null,
    is_tracked_lift: input.isTrackedLift,
  });
  revalidatePath("/coach/exercises");
  return { ok: !error };
}

export async function setExerciseActive(exerciseId: string, isActive: boolean) {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  await supabase.from("exercises").update({ is_active: isActive }).eq("id", exerciseId);
  revalidatePath("/coach/exercises");
}
