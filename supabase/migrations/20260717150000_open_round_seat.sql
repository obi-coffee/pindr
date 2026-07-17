-- Loop Phase F: open_round_seat RPC. "fill the four" — the host of a
-- locked round opens one seat at a time to the public feed. Flipping
-- status to 'open' is all it takes for the existing Phase 5b machinery
-- (rounds-near-you list, request/accept flow, filled/cancelled pushes)
-- to pick the round up; when the last seat fills, the existing
-- respond flow flips it back to 'full' and it leaves the feed.
--
-- Atomic increments live server-side so two taps can't over-open.

create or replace function public.open_round_seat(p_round_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round public.rounds%rowtype;
begin
  select * into v_round from public.rounds where id = p_round_id for update;

  if not found then
    raise exception 'round not found';
  end if;

  if v_round.host_user_id <> auth.uid() then
    raise exception 'only the host can open a spot';
  end if;

  if v_round.origin_match_id is null then
    raise exception 'this round is already a feed round';
  end if;

  if v_round.status not in ('open', 'full') then
    raise exception 'this round is %', v_round.status;
  end if;

  if v_round.seats_total >= 4 then
    raise exception 'four is the four — no more seats';
  end if;

  if v_round.tee_time <= now() then
    raise exception 'this tee time already passed';
  end if;

  update public.rounds
  set seats_total = seats_total + 1,
      seats_open = seats_open + 1,
      status = 'open'
  where id = p_round_id;
end;
$$;

revoke all on function public.open_round_seat(uuid) from public;
grant execute on function public.open_round_seat(uuid) to authenticated;

-- announce_arrival (Phase D) required status = 'full'; a locked round
-- hunting for a third is status 'open' but round day still happens.
-- Relax to open-or-full. Everything else unchanged.

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

  if v_round.status not in ('open', 'full') then
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
