-- Apple App Review demo profile for appreview@pindr.app.
--
-- Step 1 (one-time, manual): create the auth user via the Supabase
-- dashboard (Authentication > Users > Add user > Create new user)
-- with email appreview@pindr.app, password appreview2026, and the
-- "Auto Confirm User" checkbox enabled. That guarantees auth.users
-- and auth.identities are populated correctly by GoTrue itself —
-- raw SQL inserts into the auth schema are brittle across Supabase
-- versions.
--
-- Step 2 (this script, idempotent): fill in the profile row that the
-- public.handle_new_user trigger created when the user was added.
-- Re-run any time to reset Johnny's profile state mid-test.
--
-- Photos are reused Unsplash URLs already validated by seed.sql.

do $$
declare u_id uuid;
begin
  select id into u_id from auth.users where email = 'appreview@pindr.app';
  if u_id is null then
    raise exception 'auth user appreview@pindr.app not found — create it via the Supabase dashboard first (see header).';
  end if;

  update public.profiles set
    display_name = 'Johnny Appleseed',
    age = 36,
    gender = 'man',
    pronouns = 'he/him',
    bio = 'New to the area. Looking for a steady weekend group — relaxed pace, good company.',
    home_city = 'Cupertino, CA',
    home_course_name = 'Deep Cliff Golf Course',
    home_location = ST_SetSRID(ST_MakePoint(-122.0322, 37.3230), 4326)::geography,
    has_handicap = true,
    handicap = 14.6,
    years_playing = 8,
    holes_preference = '18',
    drinks = 'sometimes',
    post_round = 'hangout',
    teaching_mindset = 'open_to_tips',
    style_default = 'improvement',
    photo_urls = array[
      'https://images.unsplash.com/photo-1693163522830-dd2e1ecd4943?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MzI1NTB8MHwxfHNlYXJjaHwyM3x8bWFuJTIwZ29sZmVyfGVufDB8fHx8MTc3Njk5ODMxN3ww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1693163526219-699e747511fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MzI1NTB8MHwxfHNlYXJjaHwzMHx8bWFuJTIwZ29sZmVyfGVufDB8fHx8MTc3Njk5ODMxN3ww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/flagged/photo-1558759103-88e62f9438f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MzI1NTB8MHwxfHNlYXJjaHwxfHxtYW4lMjBnb2xmZXJ8ZW58MHx8fHwxNzc2OTk4MzE3fDA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    profile_answers = jsonb_build_object(
      'music', 'Only at the right times',
      'pace', 'Keep it moving',
      'walk_or_ride', 'Course dependent',
      'bad_shot', 'Quick reset',
      'wagers', 'Skins for snacks',
      'mulligans', 'Friendly mulligans welcome',
      'best_moment', 'Birdie on a par-5 from 220 out — first time it felt easy.',
      'improving', 'Course management. Stop trying the hero shot.',
      'snack_drink', 'Cold beer at the turn, every time.',
      'dream_course', 'Pebble Beach.'
    ),
    onboarded_at = now()
  where user_id = u_id;
end $$;
