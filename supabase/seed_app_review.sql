-- Apple App Review demo account: appreview@pindr.app / appreview2026.
-- The email isn't real, so email_confirmed_at is forced to now() —
-- the reviewer can sign in immediately. Located in Cupertino so the
-- Discover and Rounds tabs show the seeded California inventory.
--
-- Run from the Supabase SQL Editor. Idempotent — re-running first
-- removes any prior appreview@pindr.app account so you end with one
-- clean reviewer profile.
--
-- Photos are reused Unsplash URLs already validated by seed.sql.

delete from auth.users where email = 'appreview@pindr.app';

do $$
declare u_id uuid;
begin
  u_id := gen_random_uuid();

  insert into auth.users (
    id, instance_id, aud, role,
    email, email_confirmed_at,
    encrypted_password,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at
  ) values (
    u_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'appreview@pindr.app',
    now(),
    crypt('appreview2026', gen_salt('bf')),
    '{}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(),
    now()
  );

  -- Modern GoTrue requires an auth.identities row per provider for
  -- email/password sign-in to resolve the user. Without this, the
  -- credential check passes silently but no session is issued.
  insert into auth.identities (
    id, user_id, provider, provider_id,
    identity_data,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    u_id,
    'email',
    u_id::text,
    jsonb_build_object(
      'sub', u_id::text,
      'email', 'appreview@pindr.app',
      'email_verified', true,
      'phone_verified', false
    ),
    null,
    now(),
    now()
  );

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
