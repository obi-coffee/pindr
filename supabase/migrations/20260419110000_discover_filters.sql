-- Extend discover_candidates with optional filters.

drop function if exists public.discover_candidates(numeric);

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
  distance_km numeric
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  me_location geography;
begin
  select home_location into me_location
  from public.profiles
  where profiles.user_id = auth.uid();

  return query
  select
    p.user_id,
    p.display_name,
    p.age,
    p.pronouns,
    p.bio,
    p.home_city,
    p.gender,
    p.handicap,
    p.has_handicap,
    p.years_playing,
    p.walking_preference,
    p.holes_preference,
    p.pace,
    p.betting,
    p.drinks,
    p.post_round,
    p.teaching_mindset,
    p.style_default,
    p.photo_urls,
    case
      when me_location is null or p.home_location is null then null::numeric
      else (ST_Distance(me_location, p.home_location) / 1000)::numeric
    end as distance_km
  from public.profiles p
  where p.user_id <> auth.uid()
    and p.onboarded_at is not null
    and not exists (
      select 1 from public.swipes s
      where s.swiper_id = auth.uid() and s.swipee_id = p.user_id
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
