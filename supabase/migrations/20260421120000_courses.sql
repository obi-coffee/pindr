-- Phase 5b: courses table. Backs both user-posted rounds and future
-- affiliate partner inventory (GolfNow et al). partner_refs is the
-- V2-readiness slot: empty in V1, populated by partner sync jobs in V2.

create extension if not exists postgis;
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  state text,                            -- 2-letter US code when known
  country text not null default 'US',
  location geography(point, 4326) not null,
  is_public boolean not null default true,
  partner_refs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists courses_location_gix on public.courses using gist (location);
create index if not exists courses_state_city_idx on public.courses (state, city);
create index if not exists courses_name_trgm_idx on public.courses using gin (lower(name) gin_trgm_ops);

alter table public.courses enable row level security;

-- Course data is public reference data: anyone authenticated can read.
drop policy if exists "courses readable by authenticated" on public.courses;
create policy "courses readable by authenticated"
  on public.courses for select
  to authenticated
  using (true);

-- Writes happen server-side only (seed migrations, future partner sync).
-- No client-side insert/update/delete policies — RLS default-denies.
