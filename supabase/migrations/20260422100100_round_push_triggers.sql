-- Phase 5c Step 4 (commit 2/2): four round-related push triggers.
-- Uses the shared public.notify_push helper added in the prior migration.
--
-- WHEN clauses guarantee each Edge Function only runs on the specific
-- transition that warrants a push: request insert, status → accepted,
-- status → full, status → cancelled. Other updates are silently ignored.

-- 1. round_requests insert → push-on-round-request (host notified).
create or replace function public.notify_round_request_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_push(
    'push-on-round-request',
    jsonb_build_object(
      'type', 'INSERT',
      'table', 'round_requests',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_round_request_created_push on public.round_requests;
create trigger on_round_request_created_push
  after insert on public.round_requests
  for each row
  when (new.status = 'pending')
  execute function public.notify_round_request_push();

-- 2. round_requests update → accepted → push-on-round-accepted (requester notified).
create or replace function public.notify_round_accepted_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_push(
    'push-on-round-accepted',
    jsonb_build_object(
      'type', 'UPDATE',
      'table', 'round_requests',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_round_request_accepted_push on public.round_requests;
create trigger on_round_request_accepted_push
  after update of status on public.round_requests
  for each row
  when (new.status = 'accepted' and old.status is distinct from 'accepted')
  execute function public.notify_round_accepted_push();

-- 3. rounds update → full → push-on-round-full (host + accepted requesters).
create or replace function public.notify_round_full_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_push(
    'push-on-round-full',
    jsonb_build_object(
      'type', 'UPDATE',
      'table', 'rounds',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_round_filled_push on public.rounds;
create trigger on_round_filled_push
  after update of status on public.rounds
  for each row
  when (new.status = 'full' and old.status is distinct from 'full')
  execute function public.notify_round_full_push();

-- 4. rounds update → cancelled → push-on-round-cancelled (accepted requesters).
create or replace function public.notify_round_cancelled_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_push(
    'push-on-round-cancelled',
    jsonb_build_object(
      'type', 'UPDATE',
      'table', 'rounds',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_round_cancelled_push on public.rounds;
create trigger on_round_cancelled_push
  after update of status on public.rounds
  for each row
  when (new.status = 'cancelled' and old.status is distinct from 'cancelled')
  execute function public.notify_round_cancelled_push();
