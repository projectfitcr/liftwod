-- LIFTwod initial schema 5/8: RLS helper functions, time helpers, membership
-- logic shared by RPCs and views, and the three helper views.

-- ---- Role helpers -----------------------------------------------------------
-- SECURITY DEFINER so policies on profiles itself never recurse. Double-revoke
-- (public AND anon) then targeted grant — me-tool hardening lesson.

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','coach') and is_active
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and approved_at is not null and is_active
  );
$$;

revoke execute on function public.is_admin(), public.is_staff(), public.is_approved() from public, anon;
grant execute on function public.is_admin(), public.is_staff(), public.is_approved() to authenticated, service_role;

-- ---- Time helpers (Thailand has no DST: these conversions are always safe) --

create or replace function public.bkk_today()
returns date
language sql stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Bangkok')::date;
$$;

create or replace function public.bkk_week_start(ts timestamptz)
returns date
language sql immutable
set search_path = ''
as $$
  select date_trunc('week', ts at time zone 'Asia/Bangkok')::date;  -- ISO week = Mon–Sun Bangkok
$$;

-- ---- Membership logic --------------------------------------------------------

-- The membership that covers a member on a date. Precedence: a period plan
-- covering the date, else a visit pack / drop-in with visits left.
create or replace function public.current_membership(p_member uuid, p_date date default null)
returns public.memberships
language sql stable security definer
set search_path = ''
as $$
  select m.*
  from public.memberships m
  join public.membership_plans p on p.id = m.plan_id
  where m.member_id = p_member
    and m.cancelled_at is null
    and m.start_date <= coalesce(p_date, public.bkk_today())
    and (
      (p.plan_type in ('unlimited','weekly_limited') and m.end_date >= coalesce(p_date, public.bkk_today()))
      or
      (p.plan_type in ('visit_pack','drop_in') and coalesce(m.visits_remaining, 0) > 0)
    )
  order by
    case when p.plan_type in ('unlimited','weekly_limited') then 0 else 1 end,
    m.end_date desc nulls last,
    m.created_at desc
  limit 1;
$$;

create or replace function public.membership_status_of(m public.memberships)
returns public.membership_status
language sql stable security definer
set search_path = ''
as $$
  select case
    when m.cancelled_at is not null then 'expired'::public.membership_status
    when exists (
      select 1 from public.holds h
      where h.membership_id = m.id
        and public.bkk_today() between h.starts_on and h.ends_on
    ) then 'on_hold'::public.membership_status
    when p.plan_type in ('visit_pack','drop_in') then
      case when coalesce(m.visits_remaining, 0) > 0
           then 'active'::public.membership_status
           else 'expired'::public.membership_status end
    when m.end_date < public.bkk_today() then 'expired'::public.membership_status
    when m.end_date - public.bkk_today() <= 7 then 'expiring_soon'::public.membership_status
    else 'active'::public.membership_status
  end
  from public.membership_plans p
  where p.id = m.plan_id;
$$;

-- Shared booking-eligibility gate for book_class and waitlist promotion.
-- Returns {ok:true, membership_id, plan_type} or {ok:false, code, meta}.
-- Codes are stable keys the UI translates.
create or replace function public.membership_check(p_member uuid, p_session_starts timestamptz)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_date date := (p_session_starts at time zone 'Asia/Bangkok')::date;
  v_m public.memberships;
  v_plan public.membership_plans;
  v_week_start date;
  v_used integer;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_member and approved_at is not null and is_active
  ) then
    return jsonb_build_object('ok', false, 'code', 'NOT_APPROVED');
  end if;

  v_m := public.current_membership(p_member, v_date);
  if v_m.id is null then
    if exists (select 1 from public.memberships where member_id = p_member) then
      return jsonb_build_object('ok', false, 'code', 'MEMBERSHIP_EXPIRED');
    end if;
    return jsonb_build_object('ok', false, 'code', 'NO_MEMBERSHIP');
  end if;

  if exists (
    select 1 from public.holds h
    where h.membership_id = v_m.id and v_date between h.starts_on and h.ends_on
  ) then
    return jsonb_build_object('ok', false, 'code', 'ON_HOLD');
  end if;

  select * into v_plan from public.membership_plans where id = v_m.plan_id;

  if v_plan.plan_type = 'weekly_limited' then
    v_week_start := public.bkk_week_start(p_session_starts);
    -- late_cancelled still consumes the weekly slot; cancelled (before cutoff)
    -- frees it; waitlisted doesn't count until promoted.
    select count(*) into v_used
    from public.bookings b
    join public.class_sessions s on s.id = b.session_id
    where b.member_id = p_member
      and b.status in ('booked','late_cancelled')
      and public.bkk_week_start(s.starts_at) = v_week_start;

    if v_used >= v_plan.weekly_visit_limit then
      return jsonb_build_object(
        'ok', false,
        'code', 'WEEKLY_LIMIT_REACHED',
        'meta', jsonb_build_object(
          'limit', v_plan.weekly_visit_limit,
          'resets_on', (v_week_start + 7)
        )
      );
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'membership_id', v_m.id,
    'plan_type', v_plan.plan_type
  );
end;
$$;

revoke execute on function
  public.current_membership(uuid, date),
  public.membership_status_of(public.memberships),
  public.membership_check(uuid, timestamptz)
from public, anon;
grant execute on function
  public.current_membership(uuid, date),
  public.membership_status_of(public.memberships),
  public.membership_check(uuid, timestamptz)
to authenticated, service_role;

-- ---- Views -------------------------------------------------------------------

-- Owner-rights on purpose (PDPA): every member can see names/avatars for the
-- whiteboard and rosters WITHOUT profiles (phone/email) being readable.
create view public.member_directory as
  select id, full_name, nickname, avatar_url
  from public.profiles
  where is_active;

-- Owner-rights on purpose: members see capacity counts ("9/12") without
-- reading other members' booking rows.
create view public.session_availability as
  select
    s.id as session_id,
    s.capacity,
    count(*) filter (where b.status = 'booked')     as booked_count,
    count(*) filter (where b.status = 'waitlisted') as waitlist_count
  from public.class_sessions s
  left join public.bookings b on b.session_id = s.id
  group by s.id, s.capacity;

-- Invoker-rights: memberships RLS applies, so members see only their own
-- summary and staff see all.
create view public.membership_summaries
with (security_invoker = on) as
  select
    m.id,
    m.member_id,
    m.plan_id,
    m.start_date,
    m.end_date,
    m.visits_remaining,
    m.cancelled_at,
    m.note,
    p.name_en as plan_name_en,
    p.name_th as plan_name_th,
    p.plan_type,
    p.price_thb,
    p.weekly_visit_limit,
    p.visit_count,
    public.membership_status_of(m) as status,
    (select jsonb_build_object('starts_on', h.starts_on, 'ends_on', h.ends_on, 'reason', h.reason)
       from public.holds h
      where h.membership_id = m.id
        and h.ends_on >= public.bkk_today()
      order by h.starts_on
      limit 1) as upcoming_hold
  from public.memberships m
  join public.membership_plans p on p.id = m.plan_id;

revoke all on public.member_directory, public.session_availability, public.membership_summaries from public, anon;
grant select on public.member_directory, public.session_availability, public.membership_summaries to authenticated;
