-- User blocks: two-way hide in discovery + matches. RLS lets users
-- manage only their own block rows.

create table public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create index blocks_blocker_idx on public.blocks (blocker_id);
create index blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

create policy "Users can read their own blocks"
  on public.blocks for select
  using (auth.uid() = blocker_id);

create policy "Users can create blocks"
  on public.blocks for insert
  with check (auth.uid() = blocker_id);

create policy "Users can delete their own blocks"
  on public.blocks for delete
  using (auth.uid() = blocker_id);

-- Let users read the minimal profile info of users they've blocked,
-- so the blocked-users list can show names and photos.
create policy "Users can read profiles of users they have blocked"
  on public.profiles for select
  using (
    exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid()
        and b.blocked_id = profiles.user_id
    )
  );

-- Exclude blocked pairs (either direction) from discover_candidates.
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
    p.user_id, p.display_name, p.age, p.pronouns, p.bio, p.home_city,
    p.gender, p.handicap, p.has_handicap, p.years_playing,
    p.walking_preference, p.holes_preference, p.pace, p.betting,
    p.drinks, p.post_round, p.teaching_mindset, p.style_default,
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

-- Hide blocked matches from list_matches too.
create or replace function public.list_matches()
returns table (
  match_id uuid,
  matched_at timestamptz,
  other_user_id uuid,
  other_display_name text,
  other_photo_url text,
  last_message text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  unread_count integer
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return query
  with my_matches as (
    select
      m.id as match_id,
      m.created_at as matched_at,
      case
        when m.user_a_id = auth.uid() then m.user_b_id
        else m.user_a_id
      end as other_user_id
    from public.matches m
    where m.user_a_id = auth.uid() or m.user_b_id = auth.uid()
  ),
  unblocked as (
    select mm.*
    from my_matches mm
    where not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = mm.other_user_id)
         or (b.blocker_id = mm.other_user_id and b.blocked_id = auth.uid())
    )
  ),
  latest as (
    select distinct on (msg.match_id)
      msg.match_id,
      msg.body,
      msg.created_at,
      msg.sender_id
    from public.messages msg
    where msg.match_id in (select u.match_id from unblocked u)
    order by msg.match_id, msg.created_at desc
  )
  select
    u.match_id,
    u.matched_at,
    u.other_user_id,
    p.display_name,
    (p.photo_urls)[1],
    latest.body,
    latest.created_at,
    latest.sender_id,
    coalesce((
      select count(*)::integer
      from public.messages msg
      left join public.match_reads mr
        on mr.match_id = msg.match_id and mr.user_id = auth.uid()
      where msg.match_id = u.match_id
        and msg.sender_id <> auth.uid()
        and (mr.last_read_at is null or msg.created_at > mr.last_read_at)
    ), 0) as unread_count
  from unblocked u
  left join public.profiles p on p.user_id = u.other_user_id
  left join latest on latest.match_id = u.match_id
  order by coalesce(latest.created_at, u.matched_at) desc;
end;
$$;

grant execute on function public.list_matches() to authenticated;
