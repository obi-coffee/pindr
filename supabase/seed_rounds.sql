-- Dev seed: populate public.rounds with 2 rounds per seed user (the ones
-- in seed.sql with @pindr.test emails), hosted at random courses within
-- 60 miles of Washington DC. Tee times are randomized across the next
-- 30 days between 07:00 and 18:00. Re-running first deletes any prior
-- seed rounds + their requests, so you end with exactly two per host.
--
-- Run from the Supabase SQL Editor, after the main seed.sql has created
-- the @pindr.test profiles. The Rounds tab will surface these to anyone
-- logged in as a non-seed user.

-- DC center: -77.0369, 38.9072. 60 miles ≈ 96560 meters.

delete from public.rounds
where host_user_id in (
  select id from auth.users where email like '%@pindr.test'
);

do $$
declare
  v_host uuid;
  v_course uuid;
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
  for v_host in
    select id from auth.users where email like '%@pindr.test' order by id
  loop
    for i in 1..2 loop
      -- Random course within 60 miles of DC.
      select id into v_course
      from public.courses
      where ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(-77.0369, 38.9072), 4326)::geography,
        96560
      )
      order by random()
      limit 1;

      -- Random future tee time: today+1 .. today+30 days, 07:00..18:00.
      v_tee :=
        date_trunc('day', now())
        + ((1 + floor(random() * 30))::int * interval '1 day')
        + ((7 + floor(random() * 12))::int * interval '1 hour')
        + ((floor(random() * 4) * 15)::int * interval '1 minute');

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
