-- membership_summaries: include duration_months so plan-rule lines render
-- fully from the view (M2). Drop first: CREATE OR REPLACE can't insert a
-- column mid-view.

drop view if exists public.membership_summaries;

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
    p.duration_months,
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

revoke all on public.membership_summaries from public, anon;
grant select on public.membership_summaries to authenticated;
