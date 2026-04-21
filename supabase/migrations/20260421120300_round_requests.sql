-- Phase 5b: round_requests. One row per (round, requester) pair. Host
-- approves or declines; requester can withdraw a pending request.

create table if not exists public.round_requests (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  requesting_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','withdrawn')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (round_id, requesting_user_id)
);

create index if not exists round_requests_round_idx on public.round_requests (round_id);
create index if not exists round_requests_requester_idx
  on public.round_requests (requesting_user_id);

alter table public.round_requests enable row level security;

-- Requester sees their own requests.
drop policy if exists "requester reads own requests" on public.round_requests;
create policy "requester reads own requests"
  on public.round_requests for select
  to authenticated
  using (requesting_user_id = auth.uid());

-- Host sees requests on their rounds.
drop policy if exists "host reads requests on own rounds" on public.round_requests;
create policy "host reads requests on own rounds"
  on public.round_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.rounds r
      where r.id = round_requests.round_id and r.host_user_id = auth.uid()
    )
  );

-- Requester creates their own requests.
drop policy if exists "requester creates own requests" on public.round_requests;
create policy "requester creates own requests"
  on public.round_requests for insert
  to authenticated
  with check (requesting_user_id = auth.uid());

-- Requester can withdraw their own pending request.
drop policy if exists "requester withdraws own request" on public.round_requests;
create policy "requester withdraws own request"
  on public.round_requests for update
  to authenticated
  using (requesting_user_id = auth.uid())
  with check (requesting_user_id = auth.uid() and status = 'withdrawn');

-- Host accepts or declines requests on their rounds.
drop policy if exists "host responds to requests" on public.round_requests;
create policy "host responds to requests"
  on public.round_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.rounds r
      where r.id = round_requests.round_id and r.host_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rounds r
      where r.id = round_requests.round_id and r.host_user_id = auth.uid()
    )
    and status in ('accepted','declined')
  );
