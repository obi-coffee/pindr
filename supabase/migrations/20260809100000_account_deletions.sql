-- Data-audit fix #2: account deletion tombstone.
--
-- delete_my_account() removes the auth.users row and the on-delete
-- cascade erases every trace of the user — so churn is invisible and
-- historical metrics (matches in June, messages in July) silently
-- shrink whenever someone deletes. This migration records a small,
-- anonymous summary row BEFORE the delete happens.
--
-- Privacy stance: the tombstone deliberately stores NO user id, name,
-- or email — it cannot be linked back to a person. It keeps only the
-- aggregate shape of the account (how long they stayed, how much they
-- did, which city) so retention and churn math stays honest after the
-- rows are gone. This means "delete my account" still deletes
-- everything identifiable, which is the App Store 5.1.1(v) promise.
--
-- Server-side only: no app code changes, safe to apply while build 8
-- is in review. The app calls the same delete_my_account() RPC it
-- always has.

-- One row per deleted account. Read it from the Supabase dashboard;
-- RLS is enabled with no policies, so the API can never read or write
-- it (same pattern as waitlist_signups reads).
create table if not exists public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  deleted_at timestamptz not null default now(),
  signed_up_at timestamptz,
  onboarded boolean,
  days_on_pindr integer,      -- whole days between signup and deletion
  swipe_count integer,
  match_count integer,
  message_count integer,
  rounds_hosted integer,
  rounds_played integer,      -- check-ins where played = true
  home_city text              -- coarse cohort signal, not identifying
);

alter table public.account_deletions enable row level security;
-- No policies on purpose: dashboard/service-role access only.

-- Same function the app already calls — now it writes the tombstone
-- first, then deletes the user's photos from storage (the 2026-08-07
-- fix, preserved below), then deletes the auth user. The cascade chain
-- does the rest, exactly as before.
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

  -- 2) Storage cleanup (unchanged from 20260807100100): photos live
  -- under a folder named after the user's id; deleting the objects
  -- makes the public URLs stop resolving immediately.
  delete from storage.objects
  where bucket_id = 'photos'
    and (storage.foldername(name))[1] = uid::text;

  -- 3) The delete itself; on-delete cascade clears every user-owned row.
  delete from auth.users where id = uid;
end;
$$;

-- delete_my_account already has its authenticated grant from
-- 20260502120000; CREATE OR REPLACE keeps existing grants. The
-- advisor-hardening default (no PUBLIC execute on new functions)
-- applies to everything here.
