-- Loop Phase C: round_checkins. One row per (round, user) — the morning-
-- after answer to "did it happen, and how was it?". This is the pilot's
-- core metric ("% feel welcome after first round") landing in a table.
--
-- played = false with feel null   → plans fell through, no blame.
-- played = false with feel noshow → the other player didn't show.
-- played = true  with feel great|fine.

create table if not exists public.round_checkins (
  round_id uuid not null references public.rounds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  played boolean not null,
  feel text check (feel in ('great','fine','noshow')),
  created_at timestamptz not null default now(),
  primary key (round_id, user_id)
);

create index if not exists round_checkins_user_idx
  on public.round_checkins (user_id);

alter table public.round_checkins enable row level security;

-- You can only ever read your own answers. Nobody sees the other
-- player's check-in — this is a metric, not a rating system.
drop policy if exists "user reads own checkins" on public.round_checkins;
create policy "user reads own checkins"
  on public.round_checkins for select
  to authenticated
  using (user_id = auth.uid());

-- Insert your own row, and only for a round you were actually in
-- (host, or seated via an accepted request).
drop policy if exists "participant inserts own checkin" on public.round_checkins;
create policy "participant inserts own checkin"
  on public.round_checkins for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.rounds r
      where r.id = round_checkins.round_id
        and (
          r.host_user_id = auth.uid()
          or exists (
            select 1 from public.round_requests rr
            where rr.round_id = r.id
              and rr.requesting_user_id = auth.uid()
              and rr.status = 'accepted'
          )
        )
    )
  );

-- Changing your answer is allowed (fat-thumb protection), still own-row only.
drop policy if exists "user updates own checkin" on public.round_checkins;
create policy "user updates own checkin"
  on public.round_checkins for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
