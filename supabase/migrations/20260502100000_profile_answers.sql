-- Phase 2 of pre-resubmit plan: optional culture-fit questions on
-- the profile. Stored as a single JSONB column keyed by question id
-- (see lib/profile/questions.ts) so adding/changing/removing
-- questions is a one-edit operation that doesn't need a migration.
--
-- A user with no answers gets `{}`, not null — that's the "is
-- incomplete" signal for the home-screen banner.

alter table public.profiles
  add column if not exists profile_answers jsonb not null default '{}'::jsonb;

-- get_profile_by_id (added 20260502090000) needs to return the new
-- column. RETURNS TABLE shape changes require drop+recreate.

drop function if exists public.get_profile_by_id(uuid);

create or replace function public.get_profile_by_id(
  target_user_id uuid
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
  profile_answers jsonb,
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
begin
  if target_user_id = auth.uid() then
    return;
  end if;

  select coalesce(ts.location, p.home_location)
    into me_location
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
    p.home_course_name, p.gender, p.handicap, p.has_handicap, p.years_playing,
    p.walking_preference, p.holes_preference, p.pace, p.betting,
    p.drinks, p.post_round, p.teaching_mindset, p.style_default,
    p.photo_urls,
    p.profile_answers,
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
  where p.user_id = target_user_id
    and p.onboarded_at is not null
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
         or (b.blocker_id = p.user_id and b.blocked_id = auth.uid())
    );
end;
$$;

grant execute on function public.get_profile_by_id(uuid) to authenticated;
