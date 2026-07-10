-- LIFTwod initial schema 4/8: exercise library, benchmarks, workouts,
-- components, results, PRs, staff notes, notification outbox.

create table public.exercises (
  id              uuid primary key default gen_random_uuid(),
  name_en         text not null,
  name_th         text,
  category        exercise_category not null,
  demo_url        text,
  is_tracked_lift boolean not null default false,   -- drives lift-PR detection
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);
create unique index exercises_name_en_uq on public.exercises (lower(name_en));

-- Benchmark identity ("this is Fran") lives here; each programmed day gets its
-- own workouts row referencing it, so results compare across time (PRD 6.5).
create table public.benchmarks (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

create table public.workouts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  benchmark_id uuid references public.benchmarks(id),
  scheduled_on date,                 -- null = draft / library
  location_id  uuid references public.locations(id),  -- null = all locations
  published    boolean not null default false,
  reveal_at    timestamptz,         -- hide-until; null = visible once published
  coach_notes  text,                -- scaling options, member-visible
  created_by   uuid references public.profiles(id),
  updated_by   uuid references public.profiles(id),   -- "last edited by" stamp
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index workouts_scheduled_idx on public.workouts (scheduled_on);

create trigger workouts_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

alter table public.class_sessions
  add column workout_id uuid references public.workouts(id);

create table public.workout_components (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workouts(id) on delete cascade,
  position    smallint not null default 0,
  kind        component_kind not null default 'other',
  title       text,
  description text not null default '',   -- free text as the coach typed it, either language
  score_type  score_type not null default 'none',
  created_at  timestamptz not null default now()
);
create index workout_components_workout_idx on public.workout_components (workout_id, position);

create table public.workout_component_exercises (
  component_id uuid not null references public.workout_components(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id),
  position     smallint not null default 0,
  primary key (component_id, exercise_id)
);

create table public.results (
  id            uuid primary key default gen_random_uuid(),
  component_id  uuid not null references public.workout_components(id) on delete cascade,
  member_id     uuid not null references public.profiles(id),
  session_id    uuid references public.class_sessions(id),   -- null = open gym
  score_type    score_type not null,          -- denormalized from the component by trigger
  is_rx         boolean not null default false,
  time_seconds  integer check (time_seconds > 0),
  rounds        integer check (rounds >= 0),
  reps          integer check (reps >= 0),
  load_kg       numeric(6,2) check (load_kg > 0),
  distance_m    numeric(8,1) check (distance_m > 0),
  calories      integer check (calories > 0),
  comment       text,
  is_pr         boolean not null default false,  -- computed by trigger before write
  entered_by    uuid references public.profiles(id),  -- coach-on-behalf audit
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (component_id, member_id)              -- one result per member per component
);
create index results_member_idx on public.results (member_id, created_at desc);
create index results_session_idx on public.results (session_id);

create trigger results_updated_at
  before update on public.results
  for each row execute function public.set_updated_at();

create table public.prs (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.profiles(id),
  kind         pr_kind not null,
  benchmark_id uuid references public.benchmarks(id),
  exercise_id  uuid references public.exercises(id),
  result_id    uuid not null references public.results(id) on delete cascade,
  score_type   score_type not null,
  is_rx        boolean not null,     -- benchmark comparability lane
  value        numeric not null,     -- normalized: time=seconds, rounds_reps=rounds*1000+reps, else raw
  achieved_on  date not null,
  created_at   timestamptz not null default now(),
  check ((kind = 'benchmark') = (benchmark_id is not null)),
  check ((kind = 'lift')      = (exercise_id  is not null))
);
create index prs_member_idx on public.prs (member_id, kind, benchmark_id, exercise_id);

-- Coach notes on members (injuries, scaling, pastoral care) — staff-only.
create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.profiles(id) on delete cascade,
  author_id  uuid not null references public.profiles(id),
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- Durable notification hook: P0 writes rows (waitlist promotions), the email
-- adapter drains them; the P1 LINE worker takes over without schema changes.
create table public.notification_outbox (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.profiles(id),
  kind       text not null,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);
