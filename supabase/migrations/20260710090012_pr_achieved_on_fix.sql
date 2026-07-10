-- PR rows for open-gym results (no session) were stamped with today's date
-- instead of the workout's programmed date, breaking latest-per-lane picks.
-- Fall back session date → workout scheduled_on → today.

create or replace function public.results_after_write()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_lanes jsonb;
  v_achieved date;
begin
  delete from public.prs where result_id = new.id;

  if not new.is_pr then
    return null;
  end if;

  v_lanes := public.evaluate_pr_lanes(new);
  v_achieved := coalesce(
    (select session_date from public.class_sessions where id = new.session_id),
    (select w.scheduled_on
       from public.workout_components wc
       join public.workouts w on w.id = wc.workout_id
      where wc.id = new.component_id),
    public.bkk_today()
  );

  if coalesce((v_lanes->>'bench_pr')::boolean, false) then
    insert into public.prs (member_id, kind, benchmark_id, result_id, score_type, is_rx, value, achieved_on)
    values (new.member_id, 'benchmark', (v_lanes->>'benchmark_id')::uuid, new.id,
            new.score_type, new.is_rx, public.result_norm_value(new), v_achieved);
  end if;
  if coalesce((v_lanes->>'lift_pr')::boolean, false) then
    insert into public.prs (member_id, kind, exercise_id, result_id, score_type, is_rx, value, achieved_on)
    values (new.member_id, 'lift', (v_lanes->>'lift_exercise_id')::uuid, new.id,
            new.score_type, new.is_rx, public.result_norm_value(new), v_achieved);
  end if;

  return null;
end;
$$;
