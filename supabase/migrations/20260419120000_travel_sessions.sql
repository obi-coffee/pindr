-- Travel sessions + updated discover_candidates so the caller's effective
-- location is the active travel session when one exists.

create table public.travel_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  location geography(point, 4326) not null,
  city text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travel_sessions_ordered check (start_date <= end_date)
);

create index travel_sessions_user_idx on public.travel_sessions (user_id);
create index travel_sessions_window_idx
  on public.travel_sessions (user_id, start_date, end_date);

alter table public.travel_sessions enable row level security;

create policy "Users can read their own travel sessions"
  on public.travel_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own travel sessions"
  on public.travel_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own travel sessions"
  on public.travel_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own travel sessions"
  on public.travel_sessions for delete
  using (auth.uid() = user_id);

create trigger travel_sessions_set_updated_at
  before update on public.travel_sessions
  for each row
  execute function public.set_updated_at();

-- Replace discover_candidates so the caller's effective location is the
-- active travel session (if any), else their home_location. Candidates'
-- effective location stays as their home_location.
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
  select coalesce(ts.location, p.home_location) into me_location
  from public.profiles p
  left join lateral (
    select location from public.travel_sessions
    where travel_sessions.user_id = p.user_id
      and current_date between start_date and end_date
    order by start_date asc
    limit 1
  ) ts on true
  where p.user_id = auth.uid();

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
