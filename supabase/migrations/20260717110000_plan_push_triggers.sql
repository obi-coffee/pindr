-- Loop Phase B: two round_plans push triggers, using the shared
-- public.notify_push helper from Phase 5c.
--
-- WHEN clauses guarantee each Edge Function only runs on the transition
-- that warrants a push: plan insert (proposed) and status → accepted.
-- Declines and take-backs resolve quietly in the chat — no push, per
-- plan §5.10 note.

-- 1. round_plans insert → push-on-plan-proposed (other match member notified).
create or replace function public.notify_plan_proposed_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_push(
    'push-on-plan-proposed',
    jsonb_build_object(
      'type', 'INSERT',
      'table', 'round_plans',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_plan_proposed_push on public.round_plans;
create trigger on_plan_proposed_push
  after insert on public.round_plans
  for each row
  when (new.status = 'proposed')
  execute function public.notify_plan_proposed_push();

-- 2. round_plans update → accepted → push-on-plan-accepted (proposer notified).
create or replace function public.notify_plan_accepted_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_push(
    'push-on-plan-accepted',
    jsonb_build_object(
      'type', 'UPDATE',
      'table', 'round_plans',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_plan_accepted_push on public.round_plans;
create trigger on_plan_accepted_push
  after update of status on public.round_plans
  for each row
  when (new.status = 'accepted' and old.status is distinct from 'accepted')
  execute function public.notify_plan_accepted_push();
