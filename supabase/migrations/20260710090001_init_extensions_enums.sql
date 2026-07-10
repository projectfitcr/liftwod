-- LIFTwod initial schema 1/8: extensions, enums, shared trigger helpers.

create extension if not exists btree_gist;

create type user_role         as enum ('admin','coach','member');            -- 'dropin' arrives in P1
create type plan_type         as enum ('unlimited','weekly_limited','visit_pack','drop_in');
create type payment_method    as enum ('cash','transfer','promptpay','other');
create type booking_status    as enum ('booked','waitlisted','cancelled','late_cancelled');
create type session_status    as enum ('scheduled','cancelled');
create type score_type        as enum ('time','rounds_reps','load','reps','distance','calories','none');
create type component_kind    as enum ('warmup','strength','skill','metcon','cooldown','other');
create type exercise_category as enum ('squat','hinge','press','pull','olympic_lift','gymnastics','monostructural','core','other');
create type membership_status as enum ('active','expiring_soon','expired','on_hold');
create type pr_kind           as enum ('benchmark','lift');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
