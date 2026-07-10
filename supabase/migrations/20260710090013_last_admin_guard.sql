-- Admin promotion arrives in the UI; guard the lockout path: the last active
-- admin can never be demoted, deactivated, or deleted.

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

  if old.role = 'admin' and old.is_active
     and (new.role <> 'admin' or not new.is_active)
     and not exists (
       select 1 from public.profiles
       where role = 'admin' and is_active and id <> old.id
     )
  then
    raise exception 'LAST_ADMIN';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_profile_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'admin' and old.is_active
     and not exists (
       select 1 from public.profiles
       where role = 'admin' and is_active and id <> old.id
     )
  then
    raise exception 'LAST_ADMIN';
  end if;
  return old;
end;
$$;

drop trigger if exists profiles_delete_guard on public.profiles;
create trigger profiles_delete_guard
  before delete on public.profiles
  for each row execute function public.enforce_profile_delete();

revoke execute on function public.enforce_profile_delete() from public, anon, authenticated;
