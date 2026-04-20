-- Swipes, matches, mutual-right trigger, and a discover_candidates RPC.

-- Swipes: one row per directed action from swiper -> swipee.
create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid not null references auth.users(id) on delete cascade,
  swipee_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('right', 'left', 'super')),
  created_at timestamptz not null default now(),
  constraint swipes_unique_pair unique (swiper_id, swipee_id),
  constraint swipes_not_self check (swiper_id <> swipee_id)
);

create index swipes_swiper_idx on public.swipes (swiper_id);
create index swipes_swipee_idx on public.swipes (swipee_id);

alter table public.swipes enable row level security;

create policy "Users can read swipes they sent or received"
  on public.swipes for select
  using (auth.uid() = swiper_id or auth.uid() = swipee_id);

create policy "Users can create their own swipes"
  on public.swipes for insert
  with check (auth.uid() = swiper_id);

-- Matches: canonical ordering (user_a < user_b) keeps one row per pair.
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint matches_unique_pair unique (user_a_id, user_b_id),
  constraint matches_ordered check (user_a_id < user_b_id)
);

create index matches_user_a_idx on public.matches (user_a_id);
create index matches_user_b_idx on public.matches (user_b_id);

alter table public.matches enable row level security;

create policy "Users can read their own matches"
  on public.matches for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- On a right (or super) swipe, check whether the swipee previously right-swiped
-- the swiper. If so, insert a match row.
create or replace function public.create_match_on_mutual_right()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lo uuid;
  hi uuid;
begin
  if new.direction not in ('right', 'super') then
    return new;
  end if;

  if not exists (
    select 1 from public.swipes
    where swiper_id = new.swipee_id
      and swipee_id = new.swiper_id
      and direction in ('right', 'super')
  ) then
    return new;
  end if;

  if new.swiper_id < new.swipee_id then
    lo := new.swiper_id;
    hi := new.swipee_id;
  else
    lo := new.swipee_id;
    hi := new.swiper_id;
  end if;

  insert into public.matches (user_a_id, user_b_id)
  values (lo, hi)
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_swipe_create_match
  after insert on public.swipes
  for each row
  execute function public.create_match_on_mutual_right();

-- Discover RPC: onboarded profiles the caller hasn't swiped on yet,
-- optionally filtered by distance. Returns distance_km when both the
-- caller and candidate have a home_location set.
create or replace function public.discover_candidates(
  max_distance_km numeric default 100
)
returns table (
  user_id uuid,
  display_name text,
  age integer,
  pronouns text,
  bio text,
  home_city text,
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
  order by distance_km nulls last, p.updated_at desc
  limit 50;
end;
$$;

grant execute on function public.discover_candidates(numeric) to authenticated;
