-- 1.0.1 Phase D: regulars + member club + host flag (server side).
--
-- (1) get_home_course_regulars(): who else calls MY home course home.
--     Guardrail (per the 1.0.1 plan): this must not bypass discovery
--     visibility, so it mirrors discover_candidates' eligibility —
--     onboarded, not-self, blocks in both directions, and the caller's
--     women-only filter with the same spoof guard (only honored when
--     the caller's own gender is woman). Deliberate differences from
--     the deck, decided in Step 0:
--       * no swipe-history exclusion — this is a community roster, not
--         a matching queue; hiding your matches from "who plays here"
--         would make the list decay with use.
--       * no distance filter — a shared home course is inherently local.
--       * no course parameter — you can only ever list your OWN home
--         course's regulars; other clubs' rosters are unreachable by
--         construction.
--     The other person's women-only preference lives on their device
--     (audit gap 5, deferred), so it can't be honored here — same
--     asymmetry the deck has today; nobody appears in this list who
--     couldn't already appear in the caller's deck.
--
-- (2) get_profile_by_id grows three appended columns so the full
--     profile view can render the member-club tag, the host flag, and
--     the regulars entry point for course-mates. RETURNS TABLE shape
--     changes require drop+recreate (same as the availability change).

create or replace function public.get_home_course_regulars(
  women_only boolean default false
)
returns table (
  user_id uuid,
  display_name text,
  age integer,
  pronouns text,
  photo_urls text[],
  style_default text
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  me_course uuid;
  me_gender text;
  caller_is_woman boolean;
begin
  select p.home_course_id, p.gender
    into me_course, me_gender
  from public.profiles p
  where p.user_id = auth.uid();

  if me_course is null then
    return;
  end if;

  caller_is_woman :=
    lower(coalesce(me_gender, '')) in ('woman', 'women', 'female', 'f');

  return query
  select
    p.user_id, p.display_name, p.age, p.pronouns, p.photo_urls,
    p.style_default
  from public.profiles p
  where p.home_course_id = me_course
    and p.user_id <> auth.uid()
    and p.onboarded_at is not null
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
         or (b.blocker_id = p.user_id and b.blocked_id = auth.uid())
    )
    and (
      not women_only
      or not caller_is_woman
      or (p.gender is not null
          and lower(p.gender) in ('woman', 'women', 'female', 'f'))
    )
  order by p.display_name asc nulls last
  limit 100;
end;
$$;

grant execute on function public.get_home_course_regulars(boolean) to authenticated;
-- Platform attaches PUBLIC/anon execute to new functions (Phase B lesson).
revoke execute on function public.get_home_course_regulars(boolean) from public, anon;

-- ────────────────────────────────────────────────────────────────────

drop function if exists public.get_profile_by_id(uuid);

create function public.get_profile_by_id(
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
  upcoming_round_course_name text,
  availability jsonb,
  home_course_id uuid,
  home_course_is_private boolean,
  can_host_guests boolean
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
    ur.course_name as upcoming_round_course_name,
    p.availability,
    p.home_course_id,
    (hc.id is not null and not hc.is_public) as home_course_is_private,
    -- The flag only means something at a private club; never leak it
    -- for public-course homes even if the column is stale.
    (p.can_host_guests and hc.id is not null and not hc.is_public)
      as can_host_guests
  from public.profiles p
  left join public.courses hc on hc.id = p.home_course_id
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
revoke execute on function public.get_profile_by_id(uuid) from public, anon;
