-- Loop Phase A: round_plans. A plan is a proposed round between the two
-- members of a match, born inside their chat. Accepting a plan (via the
-- accept_round_plan RPC in the next migration) creates a private round:
-- seats_total = 2, seats_open = 0, status = 'full' — full rounds never
-- appear in the public "rounds near you" feed, so a locked round stays
-- between the pair. Phase F ("fill the four") later opens seats by
-- bumping seats_total and flipping status back to 'open'.
--
-- rounds.origin_match_id is how later phases (day-of screen, post-round
-- check-in) know a round came from a match and who the partner is.

alter table public.rounds
  add column if not exists origin_match_id uuid
    references public.matches(id) on delete set null;

create index if not exists rounds_origin_match_idx
  on public.rounds (origin_match_id)
  where origin_match_id is not null;

create table if not exists public.round_plans (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  proposer_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  tee_time timestamptz not null,
  note text,
  status text not null default 'proposed'
    check (status in ('proposed','accepted','declined','cancelled')),
  round_id uuid references public.rounds(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists round_plans_match_created_idx
  on public.round_plans (match_id, created_at);

alter table public.round_plans enable row level security;

-- Both members of the match can read its plans.
drop policy if exists "match members read plans" on public.round_plans;
create policy "match members read plans"
  on public.round_plans for select
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = round_plans.match_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

-- Only a member of the match can propose, and only as themself.
drop policy if exists "match members propose plans" on public.round_plans;
create policy "match members propose plans"
  on public.round_plans for insert
  to authenticated
  with check (
    proposer_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = round_plans.match_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

-- The proposer can take back a still-open plan.
drop policy if exists "proposer cancels own plan" on public.round_plans;
create policy "proposer cancels own plan"
  on public.round_plans for update
  to authenticated
  using (proposer_id = auth.uid() and status = 'proposed')
  with check (status = 'cancelled');

-- The other member can pass on a still-open plan. Accepting goes through
-- the accept_round_plan RPC (security definer), not through this policy.
drop policy if exists "partner declines plan" on public.round_plans;
create policy "partner declines plan"
  on public.round_plans for update
  to authenticated
  using (
    proposer_id <> auth.uid()
    and status = 'proposed'
    and exists (
      select 1 from public.matches m
      where m.id = round_plans.match_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  )
  with check (status = 'declined');

-- Broadcast plan inserts/updates through Realtime so the chat thread can
-- live-update plan cards, same pattern as messages. Idempotent.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'round_plans'
  ) then
    execute 'alter publication supabase_realtime add table public.round_plans';
  end if;
end $$;
