-- Guard the women_only filter: only honor the flag when the caller's own
-- gender is 'woman'. Prevents any client from spoofing the flag to force a
-- women-only view of the candidate pool.

drop function if exists public.discover_candidates(
  numeric, integer, integer, text[], numeric, numeric, text[], boolean
);

create or replace function public.discover_candidates(
  max_distance_km numeric default 100,
  min_age integer default null,
  max_age integer default null,
  genders text[] default null,
  min_handicap numeric default null,
  max_handicap numeric default null,
  play_styles text[] default null,
  women_only boolean default false
)
returns table (
  user_id uuid,
  display_name text,
  age integer,
  pronouns text,
  bio text,
  home_city text,
  home_course_name text,
  gender text,
  handicap numeric,
  has_handicap boolean,
  years_playing integer,
  walking_preference text,
  holes_preference text,
  pace text,
  betting text,
  drinks text,
  post_round text,
  teaching_mindset text,
  style_default text,
  photo_urls text[],
  distance_km numeric,
  upcoming_round_id uuid,
  upcoming_round_tee_time timestamptz,
  upcoming_round_course_name text
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  me_location geography;
  me_gender text;
  caller_is_woman boolean;
begin
  select coalesce(ts.location, p.home_location), p.gender
    into me_location, me_gender
  from public.profiles p
  left join lateral (
    select location from public.travel_sessions
    where travel_sessions.user_id = p.user_id
      and current_date between start_date and end_date
    order by start_date asc
    limit 1
  ) ts on true
  where p.user_id = auth.uid();

  caller_is_woman := lower(coalesce(me_gender, '')) in ('woman', 'women', 'female', 'f');

  return query
  select
    p.user_id, p.display_name, p.age, p.pronouns, p.bio, p.home_city,
    p.home_course_name, p.gender, p.handicap, p.has_handicap, p.years_playing,
    p.walking_preference, p.holes_preference, p.pace, p.betting,
    p.drinks, p.post_round, p.teaching_mindset, p.style_default,
    p.photo_urls,
    case
      when me_location is null or p.home_location is null then null::numeric
      else (ST_Distance(me_location, p.home_location) / 1000)::numeric
    end as distance_km,
    ur.round_id as upcoming_round_id,
    ur.tee_time as upcoming_round_tee_time,
    ur.course_name as upcoming_round_course_name
  from public.profiles p
  left join lateral (
    select r.id as round_id, r.tee_time, c.name as course_name
    from public.rounds r
    join public.courses c on c.id = r.course_id
    where r.host_user_id = p.user_id
      and r.status = 'open'
      and r.seats_open > 0
      and r.tee_time > now()
    order by r.tee_time asc
    limit 1
  ) ur on true
  where p.user_id <> auth.uid()
    and p.onboarded_at is not null
    and not exists (
      select 1 from public.swipes s
      where s.swiper_id = auth.uid() and s.swipee_id = p.user_id
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
         or (b.blocker_id = p.user_id and b.blocked_id = auth.uid())
    )
    and (
      me_location is null
      or p.home_location is null
      or ST_DWithin(me_location, p.home_location, max_distance_km * 1000)
    )
    and (min_age is null or p.age >= min_age)
    and (max_age is null or p.age <= max_age)
    and (
      genders is null
      or (p.gender is not null and lower(p.gender) = any (select lower(g) from unnest(genders) g))
    )
    and (
      not women_only
      or not caller_is_woman
      or (p.gender is not null and lower(p.gender) in ('woman', 'women', 'female', 'f'))
    )
    and (min_handicap is null or (p.has_handicap and p.handicap >= min_handicap))
    and (max_handicap is null or (p.has_handicap and p.handicap <= max_handicap))
    and (
      play_styles is null
      or (p.style_default is not null and p.style_default = any (play_styles))
    )
  order by distance_km nulls last, p.updated_at desc
  limit 50;
end;
$$;

grant execute on function public.discover_candidates(
  numeric, integer, integer, text[], numeric, numeric, text[], boolean
) to authenticated;
