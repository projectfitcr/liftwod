-- LIFTwod initial schema 6/8: booking engine RPCs, membership admin RPCs,
-- session generation, results validation + PR triggers, profile integrity,
-- admin bootstrap. Every race-prone mutation lives here, in one transaction.
--
-- Locking discipline (fixed order, everywhere):
--   1. pg_advisory_xact_lock(member)  — serializes one member across sessions
--   2. class_sessions row FOR UPDATE  — serializes capacity per session

-- ---- Profile integrity --------------------------------------------------------
-- Only admins may change protected fields through user-context requests.
-- Definer-context paths (signup trigger: auth.uid() is null) pass; the one
-- legitimate self-promotion (bootstrap_first_admin) sets a tx-local bypass.

create or replace function public.enforce_profile_integrity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.role        is distinct from old.role
      or new.approved_at is distinct from old.approved_at
      or new.approved_by is distinct from old.approved_by
      or new.is_active   is distinct from old.is_active)
     and auth.uid() is not null
     and coalesce(current_setting('app.bypass_profile_guard', true), '') <> 'on'
     and not public.is_admin()
  then
    raise exception 'PROFILE_PROTECTED_FIELDS';
  end if;
  return new;
end;
$$;

create trigger profiles_integrity
  before update on public.profiles
  for each row execute function public.enforce_profile_integrity();

-- One-shot self-serve bootstrap: promotes the CALLER iff no admin exists yet.
create or replace function public.bootstrap_first_admin()
returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  if exists (select 1 from public.profiles where role = 'admin') then
    return false;
  end if;
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles
    set role = 'admin', approved_at = now(), approved_by = id
    where id = auth.uid();
  return true;
end;
$$;

-- ---- Booking engine -----------------------------------------------------------

create or replace function public.book_class(p_session_id uuid, p_member_id uuid default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_member uuid;
  v_session public.class_sessions;
  v_settings public.app_settings;
  v_check jsonb;
  v_booked integer;
  v_waitlisted integer;
begin
  v_member := coalesce(p_member_id, auth.uid());
  if v_member is null then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  end if;
  if v_member <> auth.uid() and not public.is_staff() then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_member::text, 0));

  select * into v_session from public.class_sessions where id = p_session_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'SESSION_NOT_FOUND');
  end if;
  if v_session.status <> 'scheduled' then
    return jsonb_build_object('ok', false, 'code', 'SESSION_CANCELLED');
  end if;
  if v_session.starts_at <= now() then
    return jsonb_build_object('ok', false, 'code', 'SESSION_STARTED');
  end if;

  select * into v_settings from public.app_settings where id = 1;
  if v_session.session_date > public.bkk_today() + v_settings.booking_window_days then
    return jsonb_build_object('ok', false, 'code', 'BOOKING_WINDOW',
      'meta', jsonb_build_object('window_days', v_settings.booking_window_days));
  end if;

  if exists (
    select 1 from public.bookings
    where session_id = p_session_id and member_id = v_member
      and status in ('booked','waitlisted')
  ) then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_BOOKED');
  end if;

  v_check := public.membership_check(v_member, v_session.starts_at);
  if not (v_check->>'ok')::boolean then
    return v_check;
  end if;

  select count(*) into v_booked
    from public.bookings
    where session_id = p_session_id and status = 'booked';

  begin
    if v_booked < v_session.capacity then
      insert into public.bookings (session_id, member_id, status)
        values (p_session_id, v_member, 'booked');
      return jsonb_build_object('ok', true, 'code', 'BOOKED');
    else
      insert into public.bookings (session_id, member_id, status)
        values (p_session_id, v_member, 'waitlisted');
      select count(*) into v_waitlisted
        from public.bookings
        where session_id = p_session_id and status = 'waitlisted';
      return jsonb_build_object('ok', true, 'code', 'SESSION_FULL_WAITLISTED',
        'meta', jsonb_build_object('position', v_waitlisted));
    end if;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_BOOKED');
  end;
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_session public.class_sessions;
  v_cutoff_minutes integer;
  v_cutoff timestamptz;
  v_new_status public.booking_status;
  v_was_booked boolean;
  v_cand public.bookings;
  v_check jsonb;
  v_promoted uuid;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'BOOKING_NOT_FOUND');
  end if;
  if v_booking.member_id <> auth.uid() and not public.is_staff() then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_booking.member_id::text, 0));

  select * into v_session from public.class_sessions where id = v_booking.session_id for update;

  -- Re-read under the session lock; a concurrent cancel may have won.
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if v_booking.status not in ('booked','waitlisted') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_CANCELLED');
  end if;

  select coalesce(t.cancellation_cutoff_minutes, s.cancellation_cutoff_minutes)
    into v_cutoff_minutes
    from public.app_settings s
    left join public.class_templates t on t.id = v_session.template_id
    where s.id = 1;
  v_cutoff := v_session.starts_at - make_interval(mins => v_cutoff_minutes);

  v_was_booked := v_booking.status = 'booked';
  if now() <= v_cutoff or v_booking.status = 'waitlisted' then
    v_new_status := 'cancelled';        -- frees the Limited weekly slot
  else
    v_new_status := 'late_cancelled';   -- still consumes the weekly slot
  end if;

  update public.bookings
    set status = v_new_status, cancelled_at = now(), cancelled_by = auth.uid()
    where id = p_booking_id;

  -- Promote the first ELIGIBLE waitlisted member (a promotion could push a
  -- Limited member over their weekly cap — skip them, keep them waitlisted).
  if v_was_booked and v_session.status = 'scheduled' and v_session.starts_at > now() then
    for v_cand in
      select * from public.bookings
      where session_id = v_session.id and status = 'waitlisted'
      order by booked_at, id
    loop
      v_check := public.membership_check(v_cand.member_id, v_session.starts_at);
      if (v_check->>'ok')::boolean then
        update public.bookings
          set status = 'booked', promoted_at = now()
          where id = v_cand.id;
        insert into public.notification_outbox (member_id, kind, payload)
          values (v_cand.member_id, 'waitlist_promoted', jsonb_build_object(
            'session_id', v_session.id,
            'session_name', v_session.name,
            'starts_at', v_session.starts_at
          ));
        v_promoted := v_cand.member_id;
        exit;
      end if;
    end loop;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', case when v_new_status = 'late_cancelled' then 'LATE_CANCELLED' else 'CANCELLED' end,
    'meta', jsonb_build_object('promoted_member_id', v_promoted)
  );
end;
$$;

create or replace function public.check_in(p_session_id uuid, p_member_id uuid default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_member uuid;
  v_is_staff boolean;
  v_session public.class_sessions;
  v_m public.memberships;
  v_plan public.membership_plans;
  v_booking_id uuid;
  v_updated integer;
begin
  v_member := coalesce(p_member_id, auth.uid());
  v_is_staff := public.is_staff();
  if v_member is null then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  end if;
  if v_member <> auth.uid() and not v_is_staff then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_member::text, 0));

  select * into v_session from public.class_sessions where id = p_session_id;
  if not found or v_session.status <> 'scheduled' then
    return jsonb_build_object('ok', false, 'code', 'SESSION_NOT_FOUND');
  end if;

  -- Self check-in only inside the window; staff any time (incl. retroactive).
  if not v_is_staff and (now() < v_session.starts_at - interval '60 minutes' or now() > v_session.ends_at) then
    return jsonb_build_object('ok', false, 'code', 'CHECKIN_WINDOW');
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_member and approved_at is not null and is_active
  ) then
    return jsonb_build_object('ok', false, 'code', 'NOT_APPROVED');
  end if;

  v_m := public.current_membership(v_member, v_session.session_date);
  if v_m.id is null then
    if exists (select 1 from public.memberships where member_id = v_member) then
      return jsonb_build_object('ok', false, 'code', 'MEMBERSHIP_EXPIRED');
    end if;
    return jsonb_build_object('ok', false, 'code', 'NO_MEMBERSHIP');
  end if;
  if exists (
    select 1 from public.holds h
    where h.membership_id = v_m.id
      and v_session.session_date between h.starts_on and h.ends_on
  ) then
    return jsonb_build_object('ok', false, 'code', 'ON_HOLD');
  end if;

  select * into v_plan from public.membership_plans where id = v_m.plan_id;

  -- Punch cards deplete HERE (check-in), never at booking. The row lock on the
  -- UPDATE plus the attendance unique constraint make this exactly-once.
  if v_plan.plan_type in ('visit_pack','drop_in') then
    update public.memberships
      set visits_remaining = visits_remaining - 1
      where id = v_m.id and visits_remaining > 0;
    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      return jsonb_build_object('ok', false, 'code', 'NO_VISITS_REMAINING');
    end if;
  end if;

  select id into v_booking_id
    from public.bookings
    where session_id = p_session_id and member_id = v_member
      and status in ('booked','waitlisted')
    limit 1;

  begin
    insert into public.attendance (session_id, member_id, location_id, booking_id, membership_id, checked_in_by)
    values (
      p_session_id, v_member, v_session.location_id, v_booking_id, v_m.id,
      case when v_member <> auth.uid() then auth.uid() end
    );
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_CHECKED_IN');
  end;

  return jsonb_build_object('ok', true, 'code', 'CHECKED_IN',
    'meta', jsonb_build_object(
      'visits_remaining',
      case when v_plan.plan_type in ('visit_pack','drop_in')
           then (select visits_remaining from public.memberships where id = v_m.id) end
    ));
end;
$$;

create or replace function public.undo_check_in(p_attendance_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_att public.attendance;
  v_plan public.membership_plans;
begin
  if not public.is_staff() then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  end if;

  select * into v_att from public.attendance where id = p_attendance_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_att.member_id::text, 0));

  if v_att.membership_id is not null then
    select p.* into v_plan
      from public.memberships m
      join public.membership_plans p on p.id = m.plan_id
      where m.id = v_att.membership_id;
    if v_plan.plan_type in ('visit_pack','drop_in') then
      update public.memberships
        set visits_remaining = visits_remaining + 1
        where id = v_att.membership_id;
    end if;
  end if;

  delete from public.attendance where id = p_attendance_id;
  return jsonb_build_object('ok', true, 'code', 'UNDONE');
end;
$$;

-- ---- Membership admin RPCs ------------------------------------------------------

-- Renewal = payment + end-date extension, atomically. Period plans only; a new
-- punch card is a NEW memberships row (admin UI does a plain insert).
create or replace function public.admin_record_renewal(
  p_membership_id uuid,
  p_amount_thb integer,
  p_paid_on date,
  p_method public.payment_method,
  p_note text default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_m public.memberships;
  v_plan public.membership_plans;
  v_new_end date;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  end if;

  select * into v_m from public.memberships where id = p_membership_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;
  select * into v_plan from public.membership_plans where id = v_m.plan_id;
  if v_plan.plan_type not in ('unlimited','weekly_limited') then
    return jsonb_build_object('ok', false, 'code', 'NOT_A_PERIOD_PLAN');
  end if;

  insert into public.payments (membership_id, amount_thb, paid_on, method, note, recorded_by)
    values (p_membership_id, p_amount_thb, p_paid_on, p_method, p_note, auth.uid());

  -- Lapsed renewals restart from today, active ones extend from current end.
  v_new_end := greatest(v_m.end_date, public.bkk_today())
               + make_interval(months => v_plan.duration_months);
  update public.memberships set end_date = v_new_end where id = p_membership_id;

  return jsonb_build_object('ok', true, 'code', 'RENEWED',
    'meta', jsonb_build_object('end_date', v_new_end));
end;
$$;

create or replace function public.admin_create_hold(
  p_membership_id uuid,
  p_starts_on date,
  p_ends_on date,
  p_reason text default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_m public.memberships;
  v_plan public.membership_plans;
  v_days integer;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  end if;
  select * into v_m from public.memberships where id = p_membership_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  begin
    insert into public.holds (membership_id, starts_on, ends_on, reason, created_by)
      values (p_membership_id, p_starts_on, p_ends_on, p_reason, auth.uid());
  exception when exclusion_violation then
    return jsonb_build_object('ok', false, 'code', 'HOLD_OVERLAP');
  end;

  select * into v_plan from public.membership_plans where id = v_m.plan_id;
  if v_plan.plan_type in ('unlimited','weekly_limited') then
    v_days := p_ends_on - p_starts_on + 1;
    update public.memberships set end_date = end_date + v_days where id = p_membership_id;
  end if;

  return jsonb_build_object('ok', true, 'code', 'HOLD_CREATED');
end;
$$;

create or replace function public.admin_delete_hold(p_hold_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_hold public.holds;
  v_plan public.membership_plans;
  v_days integer;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  end if;
  select * into v_hold from public.holds where id = p_hold_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  select p.* into v_plan
    from public.memberships m
    join public.membership_plans p on p.id = m.plan_id
    where m.id = v_hold.membership_id;
  if v_plan.plan_type in ('unlimited','weekly_limited') then
    v_days := v_hold.ends_on - v_hold.starts_on + 1;
    update public.memberships set end_date = end_date - v_days where id = v_hold.membership_id;
  end if;

  delete from public.holds where id = p_hold_id;
  return jsonb_build_object('ok', true, 'code', 'HOLD_DELETED');
end;
$$;

-- ---- Session generation ----------------------------------------------------------

-- Idempotent via the (template_id, session_date) unique index; never touches
-- sessions a coach has edited. Called by the daily cron (service role) and
-- synchronously after template create/edit (admin server action).
create or replace function public.generate_sessions(p_horizon_days integer default null)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_horizon integer;
  v_count integer := 0;
  v_inserted integer;
  t record;
  d date;
  v_starts timestamptz;
begin
  select coalesce(p_horizon_days, session_horizon_days)
    into v_horizon from public.app_settings where id = 1;

  for t in select * from public.class_templates where is_active loop
    d := public.bkk_today();
    while d <= public.bkk_today() + v_horizon loop
      if extract(isodow from d) = t.day_of_week then
        v_starts := (d::timestamp + t.start_time) at time zone 'Asia/Bangkok';
        insert into public.class_sessions
          (location_id, template_id, session_date, starts_at, ends_at, name, capacity, coach_id)
        values
          (t.location_id, t.id, d, v_starts,
           v_starts + make_interval(mins => t.duration_minutes),
           t.name, t.capacity, t.coach_id)
        on conflict (template_id, session_date) where template_id is not null do nothing;
        get diagnostics v_inserted = row_count;
        v_count := v_count + v_inserted;
      end if;
      d := d + 1;
    end loop;
  end loop;

  return v_count;
end;
$$;

-- ---- Results: validation + PR detection --------------------------------------------

-- Normalized comparable value; direction: time = lower wins, all else higher.
create or replace function public.result_norm_value(r public.results)
returns numeric
language sql immutable
set search_path = ''
as $$
  select case r.score_type
    when 'time'        then r.time_seconds::numeric
    when 'rounds_reps' then r.rounds * 1000 + r.reps   -- documented convention
    when 'load'        then r.load_kg
    when 'reps'        then r.reps::numeric
    when 'distance'    then r.distance_m
    when 'calories'    then r.calories::numeric
  end;
$$;

-- Shared lane evaluation for the BEFORE (is_pr flag) and AFTER (prs rows)
-- triggers. Benchmark lane keys on (benchmark, score_type, rx) — Rx and scaled
-- are independent lanes. Lift lane keys on (tracked exercise), rx ignored.
create or replace function public.evaluate_pr_lanes(r public.results)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_bench uuid;
  v_lift uuid;
  v_lift_count integer;
  v_norm numeric;
  v_prior numeric;
  v_bench_pr boolean := false;
  v_lift_pr boolean := false;
begin
  v_norm := public.result_norm_value(r);
  if v_norm is null then
    return jsonb_build_object('bench_pr', false, 'lift_pr', false);
  end if;

  select w.benchmark_id into v_bench
    from public.workout_components wc
    join public.workouts w on w.id = wc.workout_id
    where wc.id = r.component_id;

  if v_bench is not null then
    select public.result_norm_value(pr.*) into v_prior
      from public.results pr
      join public.workout_components wc on wc.id = pr.component_id
      join public.workouts w on w.id = wc.workout_id
      where pr.member_id = r.member_id
        and w.benchmark_id = v_bench
        and pr.score_type = r.score_type
        and pr.is_rx = r.is_rx
        and pr.id <> r.id
      order by public.result_norm_value(pr.*) * (case when r.score_type = 'time' then 1 else -1 end)
      limit 1;
    v_bench_pr := v_prior is null
      or (r.score_type = 'time' and v_norm < v_prior)
      or (r.score_type <> 'time' and v_norm > v_prior);
  end if;

  if r.score_type = 'load' then
    select count(*), min(e.id::text)::uuid into v_lift_count, v_lift
      from public.workout_component_exercises wce
      join public.exercises e on e.id = wce.exercise_id
      where wce.component_id = r.component_id and e.is_tracked_lift;
    if v_lift_count = 1 then
      select max(pr.load_kg) into v_prior
        from public.results pr
        join public.workout_component_exercises wce on wce.component_id = pr.component_id
        where pr.member_id = r.member_id
          and wce.exercise_id = v_lift
          and pr.score_type = 'load'
          and pr.id <> r.id;
      v_lift_pr := v_prior is null or r.load_kg > v_prior;
    else
      v_lift := null;
    end if;
  end if;

  return jsonb_build_object(
    'bench_pr', v_bench_pr, 'benchmark_id', v_bench,
    'lift_pr', v_lift_pr, 'lift_exercise_id', v_lift
  );
end;
$$;

create or replace function public.results_before_write()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_type public.score_type;
  v_lanes jsonb;
begin
  select score_type into v_type
    from public.workout_components where id = new.component_id;
  if v_type is null then
    raise exception 'COMPONENT_NOT_FOUND';
  end if;
  if v_type = 'none' then
    raise exception 'COMPONENT_NOT_SCORED';
  end if;
  new.score_type := v_type;

  -- Exactly the columns for this score type, nothing else.
  if (new.time_seconds is not null) <> (v_type = 'time')
     or (new.rounds     is not null) <> (v_type = 'rounds_reps')
     or (new.reps       is not null) <> (v_type in ('rounds_reps','reps'))
     or (new.load_kg    is not null) <> (v_type = 'load')
     or (new.distance_m is not null) <> (v_type = 'distance')
     or (new.calories   is not null) <> (v_type = 'calories')
  then
    raise exception 'INVALID_SCORE_SHAPE';
  end if;

  v_lanes := public.evaluate_pr_lanes(new);
  new.is_pr := coalesce((v_lanes->>'bench_pr')::boolean, false)
            or coalesce((v_lanes->>'lift_pr')::boolean, false);
  return new;
end;
$$;

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

create trigger results_validate_pr
  before insert or update on public.results
  for each row execute function public.results_before_write();

create trigger results_maintain_prs
  after insert or update on public.results
  for each row execute function public.results_after_write();

-- ---- Grants ----------------------------------------------------------------------

revoke execute on function
  public.book_class(uuid, uuid),
  public.cancel_booking(uuid),
  public.check_in(uuid, uuid),
  public.undo_check_in(uuid),
  public.admin_record_renewal(uuid, integer, date, payment_method, text),
  public.admin_create_hold(uuid, date, date, text),
  public.admin_delete_hold(uuid),
  public.generate_sessions(integer),
  public.bootstrap_first_admin(),
  public.result_norm_value(public.results),
  public.evaluate_pr_lanes(public.results)
from public, anon;

grant execute on function
  public.book_class(uuid, uuid),
  public.cancel_booking(uuid),
  public.check_in(uuid, uuid),
  public.undo_check_in(uuid),
  public.admin_record_renewal(uuid, integer, date, payment_method, text),
  public.admin_create_hold(uuid, date, date, text),
  public.admin_delete_hold(uuid),
  public.bootstrap_first_admin()
to authenticated;

grant execute on function
  public.book_class(uuid, uuid),
  public.cancel_booking(uuid),
  public.check_in(uuid, uuid),
  public.undo_check_in(uuid),
  public.admin_record_renewal(uuid, integer, date, payment_method, text),
  public.admin_create_hold(uuid, date, date, text),
  public.admin_delete_hold(uuid),
  public.generate_sessions(integer),
  public.result_norm_value(public.results),
  public.evaluate_pr_lanes(public.results)
to service_role;
