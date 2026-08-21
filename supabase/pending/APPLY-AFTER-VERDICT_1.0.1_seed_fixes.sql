-- QUEUED under the production hold (2026-08-21): apply from the SQL
-- Editor only AFTER the 1.0.0 App Review verdict. Two jobs:
--
--   1. Fix existing seeded rounds with pre-dawn tee times. The old
--      generator randomized 07:00–18:45 in UTC, which is 3:00 AM ET /
--      midnight PT — the launch-week "3:45 AM tee time" bug. (The
--      generator itself is fixed in seed_rounds.sql; this repairs the
--      rows already out there.)
--   2. Give the App Review demo account and a few seed profiles home
--      courses, including one private-club-with-host-flag near the
--      demo account so the reviewer can see the member-club and
--      can-host-guests tags.
--
-- Both statements are idempotent — safe to run twice.

-- ── 1. Repair pre-dawn tee times on seed-hosted future rounds ────────
-- Only rounds hosted by @pindr.test users, only future, only where the
-- course-local hour is before 7 AM. Shift = the amount that maps the
-- old UTC-generated range back onto 8:00–14:45 local.

with tz_map as (
  select c.id as course_id,
         case
           when c.state in ('CA','OR','WA','NV') then 'America/Los_Angeles'
           when c.state in ('CO','UT','AZ','NM','MT','WY','ID') then 'America/Denver'
           when c.state in ('TX','IL','MN','MO','LA','OK','KS','AR','IA','WI','MS','AL','TN','NE','SD','ND') then 'America/Chicago'
           else 'America/New_York'
         end as tz
  from public.courses c
)
update public.rounds r
set tee_time = r.tee_time + (case m.tz
      when 'America/New_York'    then interval '5 hours'
      when 'America/Chicago'     then interval '6 hours'
      when 'America/Denver'      then interval '7 hours'
      when 'America/Los_Angeles' then interval '8 hours'
    end)
from tz_map m
where m.course_id = r.course_id
  and r.host_user_id in (select id from auth.users where email like '%@pindr.test')
  and r.tee_time > now()
  and extract(hour from r.tee_time at time zone m.tz) < 7;

-- ── 2a. Demo account: home course = Deep Cliff (matches its existing
--        home_course_name text) ──────────────────────────────────────

update public.profiles p
set home_course_id = c.id,
    home_course_name = c.name
from public.courses c
where p.user_id = (select id from auth.users where email = 'appreview@pindr.app')
  and c.name ilike 'Deep Cliff%'
  and p.home_course_id is null;

-- ── 2b. Six seed profiles get their nearest course as home ───────────
-- Deterministic pick (ordered by email) so reruns choose the same six.

update public.profiles p
set home_course_id = nearest.id,
    home_course_name = nearest.name
from (
  select u.id as user_id
  from auth.users u
  join public.profiles pr on pr.user_id = u.id
  where u.email like '%@pindr.test'
    and pr.home_location is not null
    and pr.home_course_id is null
  order by u.email
  limit 6
) pick
cross join lateral (
  select c.id, c.name
  from public.courses c
  join public.profiles pr2 on pr2.user_id = pick.user_id
  where c.is_public = true
  order by ST_Distance(c.location, pr2.home_location)
  limit 1
) nearest
where p.user_id = pick.user_id;

-- ── 2c. One seed profile near the demo account joins a private club
--        and can host guests — so the reviewer's deck/regulars shows
--        the member-club + can-host-guests tags ──────────────────────
-- Defensive: does nothing if no private club exists within ~60 miles
-- of Cupertino.

update public.profiles p
set home_course_id = club.id,
    home_course_name = club.name,
    can_host_guests = true
from (
  select u.id as user_id
  from auth.users u
  join public.profiles pr on pr.user_id = u.id
  where u.email like '%@pindr.test'
    and pr.home_location is not null
    and ST_DWithin(pr.home_location,
                   ST_SetSRID(ST_MakePoint(-122.0322, 37.3230), 4326)::geography,
                   96560)
  order by u.email
  limit 1
) pick
cross join lateral (
  select c.id, c.name
  from public.courses c
  where c.is_public = false
    and ST_DWithin(c.location,
                   ST_SetSRID(ST_MakePoint(-122.0322, 37.3230), 4326)::geography,
                   96560)
  order by ST_Distance(c.location,
                       ST_SetSRID(ST_MakePoint(-122.0322, 37.3230), 4326)::geography)
  limit 1
) club
where p.user_id = pick.user_id;

-- Verify afterwards:
--   select count(*) from public.rounds r join public.courses c on c.id = r.course_id
--   where r.tee_time > now()
--     and extract(hour from r.tee_time at time zone 'America/New_York') < 7;  -- expect 0 for ET rounds
--   select display_name, home_course_name, can_host_guests
--   from public.profiles where home_course_id is not null;
