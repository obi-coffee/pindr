-- Phase 5b: list_open_rounds RPC. Returns the rounds-list surface data:
-- rounds joined with course + host profile, filtered by blocks, excluding
-- the caller's own rounds and rounds with no open seats, sorted by
-- distance from the caller's home_location then tee_time.

create or replace function public.list_open_rounds(
  p_course_id uuid default null,
  p_from timestamptz default now(),
  p_to timestamptz default null,
  p_max_results int default 50
)
returns table (
  id uuid,
  tee_time timestamptz,
  seats_open int,
  seats_total int,
  format jsonb,
  course_id uuid,
  course_name text,
  course_city text,
  course_state text,
  host_user_id uuid,
  host_display_name text,
  host_age int,
  host_handicap numeric,
  host_has_handicap boolean,
  host_photo_url text,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select home_location
    from public.profiles
    where user_id = auth.uid()
  ),
  blocked as (
    select blocked_id as user_id from public.blocks where blocker_id = auth.uid()
    union
    select blocker_id from public.blocks where blocked_id = auth.uid()
  )
  select
    r.id,
    r.tee_time,
    r.seats_open,
    r.seats_total,
    r.format,
    c.id as course_id,
    c.name as course_name,
    c.city as course_city,
    c.state as course_state,
    p.user_id as host_user_id,
    p.display_name as host_display_name,
    p.age as host_age,
    p.handicap as host_handicap,
    p.has_handicap as host_has_handicap,
    coalesce(p.photo_urls[1], null) as host_photo_url,
    case
      when (select home_location from me) is null then null
      else (ST_Distance(c.location, (select home_location from me)) / 1000.0)
    end as distance_km
  from public.rounds r
  join public.courses c on c.id = r.course_id
  join public.profiles p on p.user_id = r.host_user_id
  where r.status = 'open'
    and r.seats_open > 0
    and r.tee_time >= p_from
    and r.tee_time <= coalesce(p_to, r.tee_time + interval '1 year')
    and r.host_user_id <> auth.uid()
    and (p_course_id is null or r.course_id = p_course_id)
    and r.host_user_id not in (select user_id from blocked)
  order by
    case
      when (select home_location from me) is null then 0
      else ST_Distance(c.location, (select home_location from me))
    end asc,
    r.tee_time asc
  limit greatest(1, least(p_max_results, 200));
$$;

grant execute on function public.list_open_rounds(uuid, timestamptz, timestamptz, int) to authenticated;
