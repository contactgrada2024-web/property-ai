-- ============================================================
-- PropertyAI — Supabase Setup
-- Run this once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists properties (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete cascade not null,
  name        text        not null default 'Unnamed Property',
  mode        text        not null check (mode in ('analyze', 'compare')),
  data        jsonb       not null default '{}'::jsonb,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row-Level Security: users can only see/edit their own rows
alter table properties enable row level security;

create policy "select own" on properties for select using (auth.uid() = user_id);
create policy "insert own" on properties for insert with check (auth.uid() = user_id);
create policy "update own" on properties for update using (auth.uid() = user_id);
create policy "delete own" on properties for delete using (auth.uid() = user_id);

-- Auto-populate user_id from the authenticated session
create or replace function _set_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

create or replace trigger trg_set_user_id
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

create or replace trigger trg_set_updated_at
  before update on properties
  for each row execute function _set_updated_at();
