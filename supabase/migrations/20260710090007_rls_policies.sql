-- LIFTwod initial schema 7/8: RLS on every table + the realtime publication.
-- Conventions: policies target `authenticated` only (anon gets nothing);
-- insert/update/delete are always split (never FOR ALL); member mutations on
-- bookings/attendance are closed at the table — RPCs only.

alter table public.locations           enable row level security;
alter table public.profiles            enable row level security;
alter table public.invites             enable row level security;
alter table public.app_settings        enable row level security;
alter table public.membership_plans    enable row level security;
alter table public.memberships         enable row level security;
alter table public.payments            enable row level security;
alter table public.holds               enable row level security;
alter table public.class_templates     enable row level security;
alter table public.class_sessions      enable row level security;
alter table public.bookings            enable row level security;
alter table public.attendance          enable row level security;
alter table public.exercises           enable row level security;
alter table public.benchmarks          enable row level security;
alter table public.workouts            enable row level security;
alter table public.workout_components  enable row level security;
alter table public.workout_component_exercises enable row level security;
alter table public.results             enable row level security;
alter table public.prs                 enable row level security;
alter table public.notes               enable row level security;
alter table public.notification_outbox enable row level security;

-- locations
create policy locations_select on public.locations for select to authenticated using (true);
create policy locations_insert on public.locations for insert to authenticated with check (public.is_admin());
create policy locations_update on public.locations for update to authenticated using (public.is_admin());
create policy locations_delete on public.locations for delete to authenticated using (public.is_admin());

-- profiles: own row or staff; creation is trigger-only; protected fields are
-- guarded by the profiles_integrity trigger. Member-facing names come from
-- the member_directory view, not this table.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.is_admin());
create policy profiles_delete_admin on public.profiles for delete to authenticated
  using (public.is_admin());

-- invites: admin-only (creation UI lives in /admin/users); redemption happens
-- inside the SECURITY DEFINER signup trigger.
create policy invites_select on public.invites for select to authenticated using (public.is_admin());
create policy invites_insert on public.invites for insert to authenticated with check (public.is_admin());
create policy invites_update on public.invites for update to authenticated using (public.is_admin());
create policy invites_delete on public.invites for delete to authenticated using (public.is_admin());

-- app_settings
create policy app_settings_select on public.app_settings for select to authenticated using (true);
create policy app_settings_update on public.app_settings for update to authenticated using (public.is_admin());

-- membership_plans: catalog is readable by everyone signed in
create policy plans_select on public.membership_plans for select to authenticated using (true);
create policy plans_insert on public.membership_plans for insert to authenticated with check (public.is_admin());
create policy plans_update on public.membership_plans for update to authenticated using (public.is_admin());
create policy plans_delete on public.membership_plans for delete to authenticated using (public.is_admin());

-- memberships: own or staff read; admin writes
create policy memberships_select on public.memberships for select to authenticated
  using (member_id = auth.uid() or public.is_staff());
create policy memberships_insert on public.memberships for insert to authenticated
  with check (public.is_admin());
create policy memberships_update on public.memberships for update to authenticated
  using (public.is_admin());
create policy memberships_delete on public.memberships for delete to authenticated
  using (public.is_admin());

-- payments: own (via membership, under invoker RLS) or staff read; admin writes
create policy payments_select on public.payments for select to authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.memberships m
               where m.id = membership_id and m.member_id = auth.uid())
  );
create policy payments_insert on public.payments for insert to authenticated
  with check (public.is_admin());
create policy payments_update on public.payments for update to authenticated
  using (public.is_admin());
create policy payments_delete on public.payments for delete to authenticated
  using (public.is_admin());

-- holds: mirror payments (writes normally via admin RPCs)
create policy holds_select on public.holds for select to authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.memberships m
               where m.id = membership_id and m.member_id = auth.uid())
  );
create policy holds_insert on public.holds for insert to authenticated
  with check (public.is_admin());
create policy holds_delete on public.holds for delete to authenticated
  using (public.is_admin());

-- class_templates / class_sessions: everyone reads, staff writes
create policy templates_select on public.class_templates for select to authenticated using (true);
create policy templates_insert on public.class_templates for insert to authenticated with check (public.is_staff());
create policy templates_update on public.class_templates for update to authenticated using (public.is_staff());
create policy templates_delete on public.class_templates for delete to authenticated using (public.is_staff());

create policy sessions_select on public.class_sessions for select to authenticated using (true);
create policy sessions_insert on public.class_sessions for insert to authenticated with check (public.is_staff());
create policy sessions_update on public.class_sessions for update to authenticated using (public.is_staff());
create policy sessions_delete on public.class_sessions for delete to authenticated using (public.is_staff());

-- bookings: own or staff read; member WRITES go through book_class /
-- cancel_booking RPCs — table-level writes are staff-only.
create policy bookings_select on public.bookings for select to authenticated
  using (member_id = auth.uid() or public.is_staff());
create policy bookings_insert on public.bookings for insert to authenticated
  with check (public.is_staff());
create policy bookings_update on public.bookings for update to authenticated
  using (public.is_staff());
create policy bookings_delete on public.bookings for delete to authenticated
  using (public.is_staff());

-- attendance: same shape as bookings (check_in / undo_check_in RPCs)
create policy attendance_select on public.attendance for select to authenticated
  using (member_id = auth.uid() or public.is_staff());
create policy attendance_insert on public.attendance for insert to authenticated
  with check (public.is_staff());
create policy attendance_update on public.attendance for update to authenticated
  using (public.is_staff());
create policy attendance_delete on public.attendance for delete to authenticated
  using (public.is_staff());

-- exercises / benchmarks: everyone reads, staff writes
create policy exercises_select on public.exercises for select to authenticated using (true);
create policy exercises_insert on public.exercises for insert to authenticated with check (public.is_staff());
create policy exercises_update on public.exercises for update to authenticated using (public.is_staff());
create policy exercises_delete on public.exercises for delete to authenticated using (public.is_staff());

create policy benchmarks_select on public.benchmarks for select to authenticated using (true);
create policy benchmarks_insert on public.benchmarks for insert to authenticated with check (public.is_staff());
create policy benchmarks_update on public.benchmarks for update to authenticated using (public.is_staff());
create policy benchmarks_delete on public.benchmarks for delete to authenticated using (public.is_staff());

-- workouts: the hide-until rule IS the policy — members only see published
-- workouts whose reveal time has passed.
create policy workouts_select on public.workouts for select to authenticated
  using (
    public.is_staff()
    or (published and (reveal_at is null or reveal_at <= now()))
  );
create policy workouts_insert on public.workouts for insert to authenticated with check (public.is_staff());
create policy workouts_update on public.workouts for update to authenticated using (public.is_staff());
create policy workouts_delete on public.workouts for delete to authenticated using (public.is_staff());

-- components + exercise links: visible when the parent workout is
create policy components_select on public.workout_components for select to authenticated
  using (exists (
    select 1 from public.workouts w
    where w.id = workout_id
      and (public.is_staff() or (w.published and (w.reveal_at is null or w.reveal_at <= now())))
  ));
create policy components_insert on public.workout_components for insert to authenticated with check (public.is_staff());
create policy components_update on public.workout_components for update to authenticated using (public.is_staff());
create policy components_delete on public.workout_components for delete to authenticated using (public.is_staff());

create policy component_exercises_select on public.workout_component_exercises for select to authenticated
  using (exists (
    select 1 from public.workout_components wc
    join public.workouts w on w.id = wc.workout_id
    where wc.id = component_id
      and (public.is_staff() or (w.published and (w.reveal_at is null or w.reveal_at <= now())))
  ));
create policy component_exercises_insert on public.workout_component_exercises for insert to authenticated with check (public.is_staff());
create policy component_exercises_update on public.workout_component_exercises for update to authenticated using (public.is_staff());
create policy component_exercises_delete on public.workout_component_exercises for delete to authenticated using (public.is_staff());

-- results: the whiteboard — every APPROVED member reads all results (this is
-- also what makes the realtime subscription work); writes are own-or-staff.
create policy results_select on public.results for select to authenticated
  using (public.is_approved() or public.is_staff());
create policy results_insert on public.results for insert to authenticated
  with check ((member_id = auth.uid() and public.is_approved()) or public.is_staff());
create policy results_update on public.results for update to authenticated
  using (member_id = auth.uid() or public.is_staff());
create policy results_delete on public.results for delete to authenticated
  using (member_id = auth.uid() or public.is_staff());

-- prs: read own or staff; written only by the SECURITY DEFINER trigger
create policy prs_select on public.prs for select to authenticated
  using (member_id = auth.uid() or public.is_staff());

-- notes: staff-only, explicitly invisible to the member (PRD)
create policy notes_select on public.notes for select to authenticated using (public.is_staff());
create policy notes_insert on public.notes for insert to authenticated with check (public.is_staff());
create policy notes_update on public.notes for update to authenticated
  using (author_id = auth.uid() or public.is_admin());
create policy notes_delete on public.notes for delete to authenticated using (public.is_admin());

-- notification_outbox: staff read; rows are written by RPCs, drained by the
-- service-role adapter (bypasses RLS).
create policy outbox_select on public.notification_outbox for select to authenticated
  using (public.is_staff());

-- Realtime: only results is published; RLS applies to subscribers.
alter publication supabase_realtime add table public.results;
