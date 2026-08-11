-- Data-audit fix #4: timestamp every round status change.
--
-- rounds knows its current status ('open' / 'full' / 'cancelled' /
-- 'completed') but not WHEN it got there — so time-to-fill and
-- cancellation timing (both headline numbers in admin_build_plan.md's
-- rounds view) can't be computed. This adds an append-only log written
-- automatically by a trigger: no RPC, no app code, and it captures
-- every path that touches status (host edits, accept_round_plan,
-- open_round_seat, request accepts, future admin actions).
--
-- Server-side only: safe to apply while build 8 is in review.
--
-- Design notes:
-- * round_id has NO foreign key on purpose. A host can delete their
--   round, and account deletion cascades rounds away; an FK cascade
--   would erase this history too — the same retroactive-shrink problem
--   the account_deletions tombstone fixes. Orphaned round_ids are fine
--   for aggregate stats.
-- * An insert row logs the round's starting status too (plan-born
--   rounds start life as 'full', posted rounds as 'open'), so every
--   round's full status timeline lives in one place.

create table if not exists public.round_status_log (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null,          -- no FK: log survives round deletion
  old_status text,                 -- null on the initial insert row
  new_status text not null,
  changed_at timestamptz not null default now()
);

create index if not exists round_status_log_round_idx
  on public.round_status_log (round_id, changed_at);

alter table public.round_status_log enable row level security;
-- No policies on purpose: dashboard/service-role access only. Rows are
-- written by the trigger below, which runs as the table owner and so
-- isn't blocked by RLS.

create or replace function public.log_round_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.round_status_log (round_id, old_status, new_status)
    values (new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.round_status_log (round_id, old_status, new_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists on_round_insert_log_status on public.rounds;
create trigger on_round_insert_log_status
  after insert on public.rounds
  for each row
  execute function public.log_round_status();

drop trigger if exists on_round_update_log_status on public.rounds;
create trigger on_round_update_log_status
  after update on public.rounds
  for each row
  execute function public.log_round_status();

-- Backfill: give every existing round a starting row so queries never
-- have to special-case pre-migration rounds. changed_at = the round's
-- created_at; current status stands in for the (unknown) history.
insert into public.round_status_log (round_id, old_status, new_status, changed_at)
select r.id, null, r.status, r.created_at
from public.rounds r
where not exists (
  select 1 from public.round_status_log l where l.round_id = r.id
);

-- Example query this unlocks (median minutes from open to full):
--   select percentile_cont(0.5) within group (order by mins) from (
--     select extract(epoch from (f.changed_at - o.changed_at)) / 60 as mins
--     from round_status_log o
--     join round_status_log f
--       on f.round_id = o.round_id and f.new_status = 'full'
--     where o.old_status is null and o.new_status = 'open'
--   ) t;
