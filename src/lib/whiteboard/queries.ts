import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWodForDate } from "@/lib/wods/queries";
import type { Database } from "@/lib/supabase/database.types";

type ScoreType = Database["public"]["Enums"]["score_type"];
type ComponentKind = Database["public"]["Enums"]["component_kind"];

export type BoardRow = {
  memberId: string;
  memberName: string;
  isRx: boolean;
  isPr: boolean;
  openGym: boolean;
  comment: string | null;
  time_seconds: number | null;
  rounds: number | null;
  reps: number | null;
  load_kg: number | null;
  distance_m: number | null;
  calories: number | null;
};

export type BoardComponent = {
  id: string;
  kind: ComponentKind;
  title: string | null;
  scoreType: ScoreType;
  description: string;
  rows: BoardRow[];
};

export type Board = {
  wodTitle: string;
  benchmarkName: string | null;
  components: BoardComponent[];
};

function norm(r: BoardRow, scoreType: ScoreType): number {
  switch (scoreType) {
    case "time":
      return r.time_seconds ?? Infinity;
    case "rounds_reps":
      return (r.rounds ?? 0) * 1000 + (r.reps ?? 0);
    case "load":
      return r.load_kg ?? 0;
    case "reps":
      return r.reps ?? 0;
    case "distance":
      return r.distance_m ?? 0;
    case "calories":
      return r.calories ?? 0;
    default:
      return 0;
  }
}

/** The day's ranked whiteboard: Rx above Scaled, time ascending, everything
 *  else descending. Viewer RLS applies to the WOD (reveal gate) and results. */
export async function getBoard(date: string): Promise<Board | null> {
  const wod = await getWodForDate(date);
  if (!wod) return null;

  const scored = wod.components.filter((c) => c.scoreType !== "none");
  const ids = scored.map((c) => c.id);
  if (ids.length === 0) {
    return { wodTitle: wod.title, benchmarkName: wod.benchmarkName, components: [] };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: results }, { data: directory }] = await Promise.all([
    supabase
      .from("results")
      .select(
        "component_id, member_id, session_id, is_rx, is_pr, comment, time_seconds, rounds, reps, load_kg, distance_m, calories"
      )
      .in("component_id", ids),
    supabase.from("member_directory").select("id, full_name, nickname"),
  ]);

  const names = new Map(
    (directory ?? []).map((d) => [d.id, d.nickname || d.full_name || "—"])
  );

  const components: BoardComponent[] = scored.map((c) => {
    const rows: BoardRow[] = (results ?? [])
      .filter((r) => r.component_id === c.id)
      .map((r) => ({
        memberId: r.member_id,
        memberName: names.get(r.member_id) ?? "—",
        isRx: r.is_rx,
        isPr: r.is_pr,
        openGym: r.session_id == null,
        comment: r.comment,
        time_seconds: r.time_seconds,
        rounds: r.rounds,
        reps: r.reps,
        load_kg: r.load_kg != null ? Number(r.load_kg) : null,
        distance_m: r.distance_m != null ? Number(r.distance_m) : null,
        calories: r.calories,
      }));

    rows.sort((a, b) => {
      if (a.isRx !== b.isRx) return a.isRx ? -1 : 1; // Rx group above Scaled
      const na = norm(a, c.scoreType);
      const nb = norm(b, c.scoreType);
      return c.scoreType === "time" ? na - nb : nb - na;
    });

    return {
      id: c.id,
      kind: c.kind,
      title: c.title,
      scoreType: c.scoreType,
      description: c.description,
      rows,
    };
  });

  return { wodTitle: wod.title, benchmarkName: wod.benchmarkName, components };
}
