-- Loop-completion demo state for the App Review account (Johnny,
-- appreview@pindr.app). Run from the Supabase SQL Editor AFTER:
--   1. seed.sql            (the @pindr.test profiles)
--   2. seed_app_review.sql (Johnny's profile)
--   3. seed_rounds.sql     (feed inventory — run BEFORE this file;
--                           re-running seed_rounds deletes test-host
--                           rounds, which would wipe the past locked
--                           round this file creates)
--   4. all 20260717* migrations applied (supabase db push)
--
-- Idempotent: re-run any time to reset Johnny's loop-demo state.
--
-- What the reviewer sees after this runs:
--   - Chat with partner A: a short conversation + a live plan card
--     waiting on Johnny ("Lock it in." / "Pass") for a round 3 days out.
--   - Chat with partner B: a locked-in round 6 days out hosted by
--     Johnny ("Open a spot." is tappable since Johnny is the host —
--     the fill-the-four demo). Six days, not tomorrow: review can
--     happen days after this script runs, and the round must still be
--     in the future when the reviewer opens the app. The TODAY card
--     only shows on round day itself.
--   - A locked round with partner B from 4 days ago with no check-in →
--     the two-tap check-in card sits on top of the rounds tab, and
--     "Run it back." pre-fills the plan screen.
--   - Availability set on Johnny and every seed profile, so the chat
--     header shows "plays weekend am · twilight" lines and full
--     profiles show WHEN THEY PLAY tags.
--
-- Side note: inserting the pending plan fires the plan-proposed push
-- trigger; Johnny has no push tokens, so it logs 'failed / no_tokens'
-- in notifications_log. Harmless.

do $$
declare
  u_johnny uuid;
  johnny_loc geography;
  u_a uuid;  -- partner A: pending plan proposal
  u_b uuid;  -- partner B: locked rounds, past + upcoming
  m_a uuid;
  m_b uuid;
  v_course uuid;
  r_up uuid;
  r_past uuid;
begin
  select id into u_johnny from auth.users where email = 'appreview@pindr.app';
  if u_johnny is null then
    raise exception 'appreview@pindr.app not found — run seed_app_review.sql first (see its header).';
  end if;

  select home_location into johnny_loc
  from public.profiles where user_id = u_johnny;
  if johnny_loc is null then
    raise exception 'Johnny has no home_location — run seed_app_review.sql first.';
  end if;

  -- The two nearest onboarded seed users become the demo partners.
  select p.user_id into u_a
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where u.email like '%@pindr.test'
    and p.onboarded_at is not null
    and p.home_location is not null
  order by ST_Distance(p.home_location, johnny_loc)
  limit 1;

  select p.user_id into u_b
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where u.email like '%@pindr.test'
    and p.onboarded_at is not null
    and p.home_location is not null
    and p.user_id <> u_a
  order by ST_Distance(p.home_location, johnny_loc)
  limit 1;

  if u_a is null or u_b is null then
    raise exception 'need at least two onboarded @pindr.test seed users — run seed.sql first.';
  end if;

  -- Reset: drop Johnny's matches (cascades messages, reads, and plans),
  -- any locked rounds born from them (and their requests + check-ins),
  -- and his notifications_log so push dedup can't suppress the demo.
  delete from public.rounds
  where origin_match_id in (
    select id from public.matches
    where user_a_id = u_johnny or user_b_id = u_johnny
  );
  delete from public.matches
  where user_a_id = u_johnny or user_b_id = u_johnny;
  delete from public.notifications_log where user_id = u_johnny;

  -- Matches (user_a < user_b per the table's ordering constraint).
  insert into public.matches (user_a_id, user_b_id, created_at)
  values (least(u_johnny, u_a), greatest(u_johnny, u_a), now() - interval '2 days')
  returning id into m_a;

  insert into public.matches (user_a_id, user_b_id, created_at)
  values (least(u_johnny, u_b), greatest(u_johnny, u_b), now() - interval '8 days')
  returning id into m_b;

  -- Nearest course to Johnny hosts everything.
  select id into v_course
  from public.courses
  order by ST_Distance(location, johnny_loc)
  limit 1;

  -- Chat A: short conversation, then a live plan proposal from partner A.
  insert into public.messages (match_id, sender_id, body, created_at) values
    (m_a, u_a,      'hey! saw we both like early rounds.',        now() - interval '3 hours'),
    (m_a, u_johnny, 'always. weekends are wide open for me.',     now() - interval '2 hours'),
    (m_a, u_a,      'say less — sending a plan.',                 now() - interval '65 minutes');

  insert into public.round_plans
    (match_id, proposer_id, course_id, tee_time, note, status, created_at)
  values
    (m_a, u_a, v_course, now() + interval '3 days', 'early nine, coffee after.',
     'proposed', now() - interval '1 hour');

  -- Chat B: the running partnership.
  insert into public.messages (match_id, sender_id, body, created_at) values
    (m_b, u_b,      'good round last week. run it back?',       now() - interval '23 hours'),
    (m_b, u_johnny, 'locked it in already. see you out there.', now() - interval '21 hours');

  -- Upcoming locked round, 6 days out, HOSTED BY JOHNNY so the reviewer
  -- can tap "Open a spot." themselves (fill the four).
  insert into public.rounds
    (host_user_id, course_id, tee_time, seats_total, seats_open,
     format, notes, status, origin_match_id)
  values
    (u_johnny, v_course, now() + interval '6 days', 2, 0,
     '{}'::jsonb, 'run it back.', 'full', m_b)
  returning id into r_up;

  insert into public.round_requests
    (round_id, requesting_user_id, status, created_at, responded_at)
  values
    (r_up, u_b, 'accepted', now() - interval '22 hours', now() - interval '22 hours');

  insert into public.round_plans
    (match_id, proposer_id, course_id, tee_time, note, status, round_id,
     created_at, responded_at)
  values
    (m_b, u_johnny, v_course, now() + interval '6 days', 'run it back.',
     'accepted', r_up, now() - interval '22 hours', now() - interval '22 hours');

  -- Past locked round, 4 days ago, hosted by partner B, no check-in →
  -- the check-in card (outside the push window, so no stray push).
  insert into public.rounds
    (host_user_id, course_id, tee_time, seats_total, seats_open,
     format, notes, status, origin_match_id)
  values
    (u_b, v_course, now() - interval '4 days', 2, 0,
     '{}'::jsonb, null, 'full', m_b)
  returning id into r_past;

  insert into public.round_requests
    (round_id, requesting_user_id, status, created_at, responded_at)
  values
    (r_past, u_johnny, 'accepted', now() - interval '5 days', now() - interval '5 days');

  insert into public.round_plans
    (match_id, proposer_id, course_id, tee_time, note, status, round_id,
     created_at, responded_at)
  values
    (m_b, u_b, v_course, now() - interval '4 days', null,
     'accepted', r_past, now() - interval '5 days', now() - interval '5 days');

  -- Johnny's availability (weekend player, catches twilight).
  update public.profiles
  set availability = jsonb_build_object(
    'weekend_am', true, 'weekend_pm', true, 'twilight', true
  )
  where user_id = u_johnny;
end $$;

-- Every seed profile gets a deterministic 2–3 availability slots so
-- chat headers and full profiles show real-looking variety.
update public.profiles p
set availability = coalesce(
  (
    select jsonb_object_agg(s.slot, true)
    from (
      select slot
      from unnest(array[
        'weekday_am','weekday_pm','weekend_am','weekend_pm','twilight'
      ]) as slot
      order by md5(p.user_id::text || slot)
      limit 2 + (('x' || substr(md5(p.user_id::text), 1, 2))::bit(8)::int % 2)
    ) s
  ),
  '{}'::jsonb
)
where p.user_id in (
  select id from auth.users where email like '%@pindr.test'
);
