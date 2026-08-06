-- Fix (found in 1.0.0 (4) smoke testing): announce_arrival rejected
-- rounds with status 'open'. A locked round whose host opened a seat
-- (fill the four, Phase F) flips 'full' -> 'open', but the day-of card
-- and "i'm here" button render for both statuses. Align the server with
-- the client: arrivals are valid for 'full' AND 'open' locked rounds.
-- Everything else is unchanged from 20260717130000_announce_arrival.sql.

create or replace function public.announce_arrival(p_round_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round public.rounds%rowtype;
  v_is_member boolean;
begin
  select * into v_round from public.rounds where id = p_round_id;

  if not found then
    raise exception 'round not found';
  end if;

  if v_round.origin_match_id is null then
    raise exception 'arrivals are for locked-in rounds';
  end if;

  if v_round.status not in ('full', 'open') then
    raise exception 'this round is not on';
  end if;

  select (
    v_round.host_user_id = auth.uid()
    or exists (
      select 1 from public.round_requests rr
      where rr.round_id = v_round.id
        and rr.requesting_user_id = auth.uid()
        and rr.status = 'accepted'
    )
  ) into v_is_member;

  if not v_is_member then
    raise exception 'this round is not yours';
  end if;

  if now() < v_round.tee_time - interval '12 hours'
     or now() > v_round.tee_time + interval '6 hours' then
    raise exception 'save it for round day';
  end if;

  perform public.notify_push(
    'push-on-arrival',
    jsonb_build_object(
      'type', 'ARRIVAL',
      'table', 'rounds',
      'record', jsonb_build_object(
        'round_id', v_round.id,
        'arriver_id', auth.uid()
      )
    )
  );
end;
$$;

revoke all on function public.announce_arrival(uuid) from public;
grant execute on function public.announce_arrival(uuid) to authenticated;
