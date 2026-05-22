-- ============================================================
-- PropertyAI — Supabase Schema & RLS (production-ready, idempotent)
-- Run once in your live Supabase project:
--   Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists properties (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null default 'Unnamed Property',
  mode        text        not null check (mode in ('analyze', 'compare')),
  data        jsonb       not null default '{}'::jsonb,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enable Row-Level Security
alter table properties enable row level security;

-- RLS policies: each user sees/edits only their own rows.
-- NOTE: UPDATE and DELETE policies use "using" only (no "with check").
-- Only INSERT uses "with check".

create policy "select_own_properties"
  on properties
  for select
  using (user_id = auth.uid());

create policy "insert_own_properties"
  on properties
  for insert
  with check (user_id = auth.uid());

create policy "update_own_properties"
  on properties
  for update
  using (user_id = auth.uid());

create policy "delete_own_properties"
  on properties
  for delete
  using (user_id = auth.uid());

-- Auto-populate user_id from the authenticated session on INSERT.
-- This trigger runs BEFORE the row is written, so user_id is set
-- before the INSERT policy's with_check is evaluated.
create or replace function _set_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

-- Drop existing trigger if it exists (idempotent re-run)
drop trigger if exists trg_set_user_id on properties;

create trigger trg_set_user_id
  before insert on properties
  for each row execute function _set_user_id();

-- Auto-update updated_at on every row change
create or replace function _set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at on properties;

create trigger trg_set_updated_at
  before update on properties
  for each row execute function _set_updated_at();
