-- Phase 5b: round-request RPCs. Keep seat decrement + round.status flip
-- atomic with the request update so clients can't half-apply a response.

-- Host accepts or declines a pending request. When accepting: decrement
-- seats_open; if it reaches zero, flip round.status to 'full'.
create or replace function public.respond_to_round_request(
  p_request_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round_id uuid;
  v_host uuid;
  v_status text;
  v_round_status text;
  v_seats_open int;
begin
  select r.id, r.host_user_id, rr.status, r.status, r.seats_open
  into v_round_id, v_host, v_status, v_round_status, v_seats_open
  from public.round_requests rr
  join public.rounds r on r.id = rr.round_id
  where rr.id = p_request_id
  for update;

  if v_round_id is null then
    raise exception 'request not found' using errcode = 'P0002';
  end if;
  if v_host <> auth.uid() then
    raise exception 'only the host can respond to this request' using errcode = '42501';
  end if;
  if v_status <> 'pending' then
    raise exception 'request already resolved' using errcode = '22023';
  end if;
  if v_round_status <> 'open' then
    raise exception 'round is not open' using errcode = '22023';
  end if;

  if p_accept then
    if v_seats_open <= 0 then
      raise exception 'no seats left' using errcode = '22023';
    end if;

    update public.round_requests
      set status = 'accepted', responded_at = now()
      where id = p_request_id;

    update public.rounds
      set seats_open = seats_open - 1,
          status = case when seats_open - 1 <= 0 then 'full' else status end
      where id = v_round_id;
  else
    update public.round_requests
      set status = 'declined', responded_at = now()
      where id = p_request_id;
  end if;
end;
$$;

grant execute on function public.respond_to_round_request(uuid, boolean) to authenticated;

-- Requester withdraws their own pending request.
create or replace function public.withdraw_round_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requester uuid;
  v_status text;
begin
  select requesting_user_id, status
  into v_requester, v_status
  from public.round_requests
  where id = p_request_id
  for update;

  if v_requester is null then
    raise exception 'request not found' using errcode = 'P0002';
  end if;
  if v_requester <> auth.uid() then
    raise exception 'not your request' using errcode = '42501';
  end if;
  if v_status <> 'pending' then
    raise exception 'only pending requests can be withdrawn' using errcode = '22023';
  end if;

  update public.round_requests
    set status = 'withdrawn', responded_at = now()
    where id = p_request_id;
end;
$$;

grant execute on function public.withdraw_round_request(uuid) to authenticated;

-- Host-facing: pending + accepted + declined requests on a round they own,
-- with requester profile fields. RLS on round_requests already gates host
-- visibility; this function just joins for convenience.
create or replace function public.list_round_requests(p_round_id uuid)
returns table (
  id uuid,
  status text,
  created_at timestamptz,
  requesting_user_id uuid,
  requester_display_name text,
  requester_age int,
  requester_handicap numeric,
  requester_has_handicap boolean,
  requester_photo_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    rr.id,
    rr.status,
    rr.created_at,
    rr.requesting_user_id,
    p.display_name,
    p.age,
    p.handicap,
    p.has_handicap,
    coalesce(p.photo_urls[1], null)
  from public.round_requests rr
  join public.profiles p on p.user_id = rr.requesting_user_id
  join public.rounds r on r.id = rr.round_id
  where rr.round_id = p_round_id
    and r.host_user_id = auth.uid()
  order by
    case rr.status
      when 'pending' then 0
      when 'accepted' then 1
      when 'declined' then 2
      when 'withdrawn' then 3
      else 4
    end asc,
    rr.created_at asc;
$$;

grant execute on function public.list_round_requests(uuid) to authenticated;
