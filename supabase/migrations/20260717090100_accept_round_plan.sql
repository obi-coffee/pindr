-- Loop Phase A: accept_round_plan RPC. Runs as security definer so it can,
-- in one transaction: create the private round (host = proposer), seat the
-- accepter via an already-accepted round_request row, and stamp the plan.
--
-- Why an RPC instead of client-side writes: the three writes must succeed
-- or fail together, and RLS (correctly) won't let the accepter insert a
-- round hosted by the proposer.
--
-- Push-trigger interactions, deliberate:
-- - round_requests insert trigger only fires on status = 'pending';
--   we insert 'accepted', so no stray "someone requested" push.
-- - rounds 'full' trigger only fires on UPDATE; we insert already-full,
--   so no stray "round filled" push. Phase B adds the real plan pushes.

create or replace function public.accept_round_plan(p_plan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.round_plans%rowtype;
  v_match public.matches%rowtype;
  v_round_id uuid;
begin
  select * into v_plan
  from public.round_plans
  where id = p_plan_id
  for update;

  if not found then
    raise exception 'plan not found';
  end if;

  select * into v_match from public.matches where id = v_plan.match_id;

  if v_match.user_a_id <> auth.uid() and v_match.user_b_id <> auth.uid() then
    raise exception 'this plan is not yours to answer';
  end if;

  if v_plan.proposer_id = auth.uid() then
    raise exception 'you proposed this one — your match has to lock it in';
  end if;

  if v_plan.status <> 'proposed' then
    raise exception 'this plan was already %', v_plan.status;
  end if;

  if v_plan.tee_time <= now() then
    raise exception 'that tee time already passed — propose a new one';
  end if;

  insert into public.rounds
    (host_user_id, course_id, tee_time, seats_total, seats_open,
     format, notes, status, origin_match_id)
  values
    (v_plan.proposer_id, v_plan.course_id, v_plan.tee_time, 2, 0,
     '{}'::jsonb, v_plan.note, 'full', v_plan.match_id)
  returning id into v_round_id;

  insert into public.round_requests
    (round_id, requesting_user_id, status, responded_at)
  values
    (v_round_id, auth.uid(), 'accepted', now());

  update public.round_plans
  set status = 'accepted',
      round_id = v_round_id,
      responded_at = now()
  where id = p_plan_id;

  return v_round_id;
end;
$$;

revoke all on function public.accept_round_plan(uuid) from public;
grant execute on function public.accept_round_plan(uuid) to authenticated;
