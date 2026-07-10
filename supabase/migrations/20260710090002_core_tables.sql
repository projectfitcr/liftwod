-- LIFTwod initial schema 2/8: locations, profiles (+ signup trigger), invites,
-- app settings, membership plans, memberships, payments, holds.

create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  timezone   text not null default 'Asia/Bangkok',  -- stored for the future; v1 hard-assumes Bangkok everywhere
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role not null default 'member',
  full_name    text not null default '',
  nickname     text,
  email        text,
  phone        text,
  preferred_language text not null default 'th' check (preferred_language in ('th','en')),
  avatar_url   text,
  approved_at  timestamptz,          -- null = awaiting admin approval (PRD 6.1)
  approved_by  uuid references public.profiles(id),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.invites (
  token      uuid primary key default gen_random_uuid(),
  role       user_role not null default 'member' check (role <> 'admin'),
  email      text,
  note       text,
  expires_at timestamptz not null default now() + interval '14 days',
  used_at    timestamptz,
  used_by    uuid references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Signup path for every identity source (email, invite link, later Google):
-- one trigger creates the profile; a valid invite token in the signup
-- metadata sets the role and skips the approval queue.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.invites%rowtype;
  v_token  uuid;
begin
  begin
    v_token := nullif(new.raw_user_meta_data->>'invite_token', '')::uuid;
  exception when others then
    v_token := null;
  end;

  insert into public.profiles (id, full_name, email, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    case when new.raw_user_meta_data->>'preferred_language' in ('th','en')
         then new.raw_user_meta_data->>'preferred_language'
         else 'th' end
  );

  if v_token is not null then
    select * into v_invite
      from public.invites
      where token = v_token and used_at is null and expires_at > now()
      for update;
    if found then
      update public.profiles
        set role = v_invite.role,
            approved_at = now(),
            approved_by = v_invite.created_by
        where id = new.id;
      update public.invites
        set used_at = now(), used_by = new.id
        where token = v_token;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_user_email();

-- Single-row typed settings (not key/value).
create table public.app_settings (
  id smallint primary key default 1 check (id = 1),
  cancellation_cutoff_minutes integer not null default 120,
  booking_window_days         integer not null default 14,
  session_horizon_days        integer not null default 21,
  updated_at timestamptz not null default now()
);

create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- Plan rows are immutable once sold: to change rules, retire (is_active=false)
-- and create a new row. memberships can then reference plan fields safely.
create table public.membership_plans (
  id                 uuid primary key default gen_random_uuid(),
  name_en            text not null,
  name_th            text not null,
  plan_type          plan_type not null,
  price_thb          integer not null check (price_thb >= 0),
  duration_months    integer check (duration_months > 0),
  weekly_visit_limit integer check (weekly_visit_limit > 0),
  visit_count        integer check (visit_count > 0),
  is_active          boolean not null default true,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  check ((plan_type in ('unlimited','weekly_limited')) = (duration_months is not null)),
  check ((plan_type = 'weekly_limited') = (weekly_visit_limit is not null)),
  check ((plan_type in ('visit_pack','drop_in')) = (visit_count is not null))
);

create table public.memberships (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid not null references public.profiles(id),
  plan_id          uuid not null references public.membership_plans(id),
  start_date       date not null,
  end_date         date,      -- null = visit pack / drop-in (punch cards never expire)
  visits_remaining integer check (visits_remaining >= 0),
  cancelled_at     timestamptz,
  note             text,
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now()
);
create index memberships_member_idx on public.memberships (member_id, start_date desc);

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id),
  amount_thb    integer not null check (amount_thb > 0),
  paid_on       date not null,
  method        payment_method not null,
  note          text,
  recorded_by   uuid not null references public.profiles(id),
  created_at    timestamptz not null default now()
);
create index payments_membership_idx on public.payments (membership_id);
create index payments_paid_on_idx on public.payments (paid_on desc);

create table public.holds (
  id            uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  starts_on     date not null,
  ends_on       date not null,
  reason        text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  check (ends_on >= starts_on),
  exclude using gist (membership_id with =, daterange(starts_on, ends_on, '[]') with &&)
);
