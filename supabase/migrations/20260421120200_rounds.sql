-- Phase 5b: rounds. A round is a user-posted (or, in V2, partner-sourced)
-- tee time that other users can request to join. source/external_ref/
-- price_cents are the V2-readiness slots: V1 only writes source='user_posted'
-- and leaves external_ref/price_cents null. V2 affiliate sync writes the
-- other branches without a schema migration.

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  tee_time timestamptz not null,
  seats_total int not null check (seats_total between 1 and 4),
  seats_open int not null check (seats_open >= 0 and seats_open <= seats_total),
  format jsonb not null default '{}'::jsonb,
  notes text,
  status text not null default 'open'
    check (status in ('open','full','cancelled','completed')),
  source text not null default 'user_posted'
    check (source in ('user_posted','golfnow')),
  external_ref text,
  price_cents int,
  created_at timestamptz not null default now()
);

create index if not exists rounds_tee_time_idx on public.rounds (tee_time);
create index if not exists rounds_course_tee_idx on public.rounds (course_id, tee_time);
create index if not exists rounds_host_idx on public.rounds (host_user_id);
create index if not exists rounds_status_tee_idx on public.rounds (status, tee_time);

alter table public.rounds enable row level security;

-- Any authenticated user can read rounds (the list surface filters client-side
-- by status/tee_time). If V2 adds private invite-only rounds, tighten here.
drop policy if exists "rounds readable by authenticated" on public.rounds;
create policy "rounds readable by authenticated"
  on public.rounds for select
  to authenticated
  using (true);

-- Host-only writes.
drop policy if exists "host inserts own rounds" on public.rounds;
create policy "host inserts own rounds"
  on public.rounds for insert
  to authenticated
  with check (host_user_id = auth.uid());

drop policy if exists "host updates own rounds" on public.rounds;
create policy "host updates own rounds"
  on public.rounds for update
  to authenticated
  using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

drop policy if exists "host deletes own rounds" on public.rounds;
create policy "host deletes own rounds"
  on public.rounds for delete
  to authenticated
  using (host_user_id = auth.uid());
