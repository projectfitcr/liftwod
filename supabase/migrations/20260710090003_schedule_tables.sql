-- LIFTwod initial schema 3/8: class templates, sessions, bookings, attendance.
-- (class_sessions.workout_id is added in 4/8 once workouts exists.)

create table public.class_templates (
  id                  uuid primary key default gen_random_uuid(),
  location_id         uuid not null references public.locations(id),
  name                text not null,                 -- coach-entered, either language
  day_of_week         smallint not null check (day_of_week between 1 and 7),  -- ISO: 1 = Monday
  start_time          time not null,                 -- Bangkok wall clock
  duration_minutes    integer not null default 60 check (duration_minutes > 0),
  capacity            integer not null check (capacity > 0),
  coach_id            uuid references public.profiles(id),
  cancellation_cutoff_minutes integer,               -- null = app_settings default
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger class_templates_updated_at
  before update on public.class_templates
  for each row execute function public.set_updated_at();

create table public.class_sessions (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references public.locations(id),
  template_id  uuid references public.class_templates(id) on delete set null,  -- null = ad-hoc
  session_date date not null,                        -- Bangkok date; uniqueness + queries
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  name         text not null,
  capacity     integer not null check (capacity > 0),
  coach_id     uuid references public.profiles(id),
  status       session_status not null default 'scheduled',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (ends_at > starts_at)
);

create unique index class_sessions_template_date_uq
  on public.class_sessions (template_id, session_date) where template_id is not null;
create index class_sessions_location_starts_idx on public.class_sessions (location_id, starts_at);
create index class_sessions_date_idx on public.class_sessions (session_date);

create trigger class_sessions_updated_at
  before update on public.class_sessions
  for each row execute function public.set_updated_at();

-- Waitlist order is DERIVED (booked_at, id among status='waitlisted') — no
-- stored position column to renumber. Rebooking after a cancel is a new row.
create table public.bookings (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.class_sessions(id) on delete cascade,
  member_id    uuid not null references public.profiles(id),
  status       booking_status not null default 'booked',
  booked_at    timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id),
  promoted_at  timestamptz,
  created_at   timestamptz not null default now()
);

create unique index bookings_live_uq
  on public.bookings (session_id, member_id) where status in ('booked','waitlisted');
create index bookings_member_idx on public.bookings (member_id, booked_at desc);
create index bookings_session_status_idx on public.bookings (session_id, status);

create table public.attendance (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.class_sessions(id),
  member_id     uuid not null references public.profiles(id),
  location_id   uuid not null references public.locations(id),   -- denormalized per PRD §7
  booking_id    uuid references public.bookings(id),             -- null = walk-in
  membership_id uuid references public.memberships(id),          -- which membership covered the visit
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references public.profiles(id),             -- null = self check-in
  unique (session_id, member_id)                                 -- backs exactly-once punch depletion
);
create index attendance_member_idx on public.attendance (member_id, checked_in_at desc);
