-- Baseline ("initial") PRs: members record existing bests for tracked lifts
-- and benchmarks without waiting for them to be programmed. Mechanism: one
-- shared hidden baseline workout+component per benchmark/lift (is_baseline,
-- published, never scheduled — so it never appears on WOD pages or boards);
-- a member's baseline is an ordinary results row there, and the existing PR
-- triggers do the rest.

alter table public.benchmarks
  add column score_type public.score_type not null default 'time';
update public.benchmarks set score_type = 'rounds_reps' where name = 'Cindy';

alter table public.workouts
  add column is_baseline boolean not null default false;

-- Honest PR dates for baselines entered after the fact.
alter table public.results
  add column achieved_on date;

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
    new.achieved_on,
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

-- Find-or-create the shared baseline component for a benchmark or tracked
-- lift. SECURITY DEFINER: members can't create workouts through RLS, but this
-- creates only the one controlled shape.
create or replace function public.ensure_baseline_component(p_kind public.pr_kind, p_ref uuid)
returns table (component_id uuid, component_score_type public.score_type)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_workout uuid;
  v_component uuid;
  v_type public.score_type;
  v_name text;
  v_desc text;
begin
  perform pg_advisory_xact_lock(hashtextextended('baseline:' || p_ref::text, 0));

  if p_kind = 'benchmark' then
    select b.score_type, b.name, coalesce(b.description, '')
      into v_type, v_name, v_desc
      from public.benchmarks b where b.id = p_ref;
    if v_name is null then
      raise exception 'NOT_FOUND';
    end if;
    select wc.id into v_component
      from public.workouts w
      join public.workout_components wc on wc.workout_id = w.id
      where w.is_baseline and w.benchmark_id = p_ref
      limit 1;
    if v_component is null then
      insert into public.workouts (title, benchmark_id, published, is_baseline)
        values (v_name, p_ref, true, true) returning id into v_workout;
      insert into public.workout_components (workout_id, position, kind, description, score_type)
        values (v_workout, 1, 'metcon', v_desc, v_type) returning id into v_component;
    end if;
  else
    select e.name_en into v_name
      from public.exercises e where e.id = p_ref and e.is_tracked_lift;
    if v_name is null then
      raise exception 'NOT_FOUND';
    end if;
    v_type := 'load';
    select wc.id into v_component
      from public.workouts w
      join public.workout_components wc on wc.workout_id = w.id
      join public.workout_component_exercises wce
        on wce.component_id = wc.id and wce.exercise_id = p_ref
      where w.is_baseline and w.benchmark_id is null
      limit 1;
    if v_component is null then
      insert into public.workouts (title, published, is_baseline)
        values (v_name, true, true) returning id into v_workout;
      insert into public.workout_components (workout_id, position, kind, description, score_type)
        values (v_workout, 1, 'strength', '', 'load') returning id into v_component;
      insert into public.workout_component_exercises (component_id, exercise_id)
        values (v_component, p_ref);
    end if;
  end if;

  return query select v_component, v_type;
end;
$$;

revoke execute on function public.ensure_baseline_component(public.pr_kind, uuid) from public, anon;
grant execute on function public.ensure_baseline_component(public.pr_kind, uuid) to authenticated, service_role;
