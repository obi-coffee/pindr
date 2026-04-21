-- Phase 5b: course typeahead RPC. Case-insensitive name match, ordered by
-- distance from the caller's home_location when present (falls back to
-- alphabetical). Uses auth.uid() server-side so the client doesn't need
-- to pass coordinates.

create or replace function public.search_courses(
  q text,
  max_results int default 20
)
returns table (
  id uuid,
  name text,
  city text,
  state text,
  lng double precision,
  lat double precision,
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
  )
  select
    c.id,
    c.name,
    c.city,
    c.state,
    ST_X(c.location::geometry) as lng,
    ST_Y(c.location::geometry) as lat,
    case
      when (select home_location from me) is null then null
      else (ST_Distance(c.location, (select home_location from me)) / 1000.0)
    end as distance_km
  from public.courses c
  where c.name ilike '%' || q || '%'
  order by
    case
      when (select home_location from me) is null then 0
      else ST_Distance(c.location, (select home_location from me))
    end asc,
    c.name asc
  limit greatest(1, least(max_results, 50));
$$;

grant execute on function public.search_courses(text, int) to authenticated;
