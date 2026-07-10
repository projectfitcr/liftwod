import { requireStaff } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ExercisesAdmin } from "./ExercisesAdmin";

export default async function CoachExercisesPage() {
  await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("category")
    .order("name_en");

  return <ExercisesAdmin exercises={exercises ?? []} />;
}
