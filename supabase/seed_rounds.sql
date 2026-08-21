-- Dev seed: populate public.rounds with 2 rounds per seed user (the
-- ones in seed.sql with @pindr.test emails), hosted at random courses
-- within 60 miles of each host's own home_location. That gives DC hosts
-- DC rounds, Bay Area hosts Bay Area rounds, and SoCal hosts SoCal
-- rounds — so a tester in any of those regions sees nearby inventory.
-- Tee times are randomized across the next 30 days between 07:00 and
-- 18:00. Re-running first deletes any prior seed rounds + their
-- requests, so you end with exactly two per host.
--
-- Run from the Supabase SQL Editor, after the main seed.sql has created
-- the @pindr.test profiles. The Rounds tab will surface these to anyone
-- logged in as a non-seed user.

-- 60 miles ≈ 96560 meters.

delete from public.rounds
where host_user_id in (
  select id from auth.users where email like '%@pindr.test'
);

do $$
declare
  v_host uuid;
  v_host_loc geography;
  v_course uuid;
  v_course_state text;
  v_tz text;
  v_tee timestamptz;
  v_seats int;
  v_walking text;
  v_match text;
  v_notes_pool text[] := array[
    'bringing beers, 9 only, no phones — whatever the hang calls for.',
    'chill round. first-timers welcome.',
    'tight group, ready golf. bring your A-game.',
    'post-round brew at the clubhouse.',
    'looking for good energy. handicap doesn''t matter.',
    'early tee, back by noon.',
    'back 9 only. quick hang.',
    null
  ];
  i int;
begin
  for v_host, v_host_loc in
    select u.id, p.home_location
    from auth.users u
    join public.profiles p on p.user_id = u.id
    where u.email like '%@pindr.test'
      and p.home_location is not null
    order by u.id
  loop
    for i in 1..2 loop
      -- Random course within 60 miles of this host's home_location.
      -- Falls back to the nearest course if none qualify (rural hosts).
      select id, state into v_course, v_course_state
      from public.courses
      where ST_DWithin(location, v_host_loc, 96560)
      order by random()
      limit 1;

      if v_course is null then
        select id, state into v_course, v_course_state
        from public.courses
        order by ST_Distance(location, v_host_loc)
        limit 1;
      end if;

      -- Random future tee time: today+1 .. today+30 days, 07:00..18:00
      -- in the COURSE'S local time. Generating in UTC (the session tz)
      -- put east-coast rounds at 3–4 AM local — the launch-week
      -- "3:45 AM tee time" bug.
      v_tz := case
        when v_course_state in ('CA', 'OR', 'WA', 'NV') then 'America/Los_Angeles'
        when v_course_state in ('CO', 'UT', 'AZ', 'NM', 'MT', 'WY', 'ID') then 'America/Denver'
        when v_course_state in ('TX', 'IL', 'MN', 'MO', 'LA', 'OK', 'KS', 'AR', 'IA', 'WI', 'MS', 'AL', 'TN', 'NE', 'SD', 'ND') then 'America/Chicago'
        else 'America/New_York'
      end;
      v_tee :=
        (date_trunc('day', now() at time zone v_tz)
         + ((1 + floor(random() * 30))::int * interval '1 day')
         + ((7 + floor(random() * 12))::int * interval '1 hour')
         + ((floor(random() * 4) * 15)::int * interval '1 minute'))
        at time zone v_tz;

      v_seats := 2 + floor(random() * 3)::int;  -- 2, 3, or 4
      v_walking := (array['walk','ride','either'])[1 + floor(random() * 3)::int];
      v_match := (array['casual','competitive','either'])[1 + floor(random() * 3)::int];

      insert into public.rounds (
        host_user_id, course_id, tee_time,
        seats_total, seats_open,
        format, notes, status, source
      ) values (
        v_host,
        v_course,
        v_tee,
        v_seats,
        v_seats - 1,
        jsonb_build_object('walking', v_walking, 'match_type', v_match),
        v_notes_pool[1 + floor(random() * array_length(v_notes_pool, 1))::int],
        'open',
        'user_posted'
      );
    end loop;
  end loop;
end $$;
