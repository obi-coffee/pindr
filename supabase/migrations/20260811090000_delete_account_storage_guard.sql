-- Fix: delete_my_account() fails on the storage cleanup step.
--
-- A Supabase platform upgrade added a protect_delete() trigger on
-- storage.objects: direct SQL deletes now raise
--   "Direct deletion from storage tables is not allowed"
-- unless the transaction sets storage.allow_delete_query = 'true'
-- first (the trigger's own documented escape hatch). Our 2026-08-07
-- photo cleanup inside delete_my_account() is exactly such a direct
-- delete, so EVERY account deletion — including a real user tapping
-- "delete my account" in the app — currently errors and rolls back.
-- Found 2026-08-11 while verifying the Phase A tombstone.
--
-- This recreates the function unchanged except for one line: the
-- set_config() call before the storage delete. is_local => true scopes
-- the flag to this transaction only; the platform guard stays active
-- everywhere else.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'unauthenticated';
  end if;

  -- 1) Tombstone: anonymous summary of the account being deleted.
  insert into public.account_deletions (
    signed_up_at, onboarded, days_on_pindr,
    swipe_count, match_count, message_count,
    rounds_hosted, rounds_played, home_city
  )
  select
    p.created_at,
    p.onboarded_at is not null,
    greatest(0, extract(day from now() - p.created_at))::integer,
    (select count(*) from public.swipes s
      where s.swiper_id = uid),
    (select count(*) from public.matches m
      where m.user_a_id = uid or m.user_b_id = uid),
    (select count(*) from public.messages msg
      where msg.sender_id = uid),
    (select count(*) from public.rounds r
      where r.host_user_id = uid),
    (select count(*) from public.round_checkins rc
      where rc.user_id = uid and rc.played),
    p.home_city
  from public.profiles p
  where p.user_id = uid;

  -- 2) Storage cleanup (from 20260807100100). The set_config line is
  -- the platform guard's escape hatch — transaction-scoped, so direct
  -- storage deletes stay blocked everywhere else.
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects
  where bucket_id = 'photos'
    and (storage.foldername(name))[1] = uid::text;

  -- 3) The delete itself; on-delete cascade clears every user-owned row.
  delete from auth.users where id = uid;
end;
$$;

-- Grants: unchanged. CREATE OR REPLACE keeps the existing authenticated
-- grant from 20260502120000.
