-- Dev seed: populates public.profiles with 26 mock users scattered across
-- the Bay Area, Phoenix, NYC, Chicago, LA, Austin, and Denver so Discover
-- and filters have something real to exercise. Run from the Supabase SQL
-- Editor. Re-running first deletes any previous seed users (identified by
-- @pindr.test) so you end with exactly the set defined below.

create extension if not exists pgcrypto;

delete from auth.users where email like '%@pindr.test';

do $$
declare
  v_emails text[] := array[
    'alex.seed@pindr.test', 'sam.seed@pindr.test',
    'jordan.seed@pindr.test', 'casey.seed@pindr.test',
    'riley.seed@pindr.test', 'morgan.seed@pindr.test',
    'quinn.seed@pindr.test', 'taylor.seed@pindr.test',
    'priya.seed@pindr.test', 'marcus.seed@pindr.test',
    'jamie.seed@pindr.test', 'devi.seed@pindr.test',
    'eli.seed@pindr.test', 'sophia.seed@pindr.test',
    'noah.seed@pindr.test', 'maya.seed@pindr.test',
    'chris.seed@pindr.test', 'dana.seed@pindr.test',
    'kyle.seed@pindr.test', 'laila.seed@pindr.test',
    'tomas.seed@pindr.test', 'asha.seed@pindr.test',
    'ben.seed@pindr.test', 'harper.seed@pindr.test',
    'zoey.seed@pindr.test', 'leo.seed@pindr.test'
  ];
  v_names text[] := array[
    'Alex', 'Sam', 'Jordan', 'Casey',
    'Riley', 'Morgan', 'Quinn', 'Taylor',
    'Priya', 'Marcus', 'Jamie', 'Devi',
    'Eli', 'Sophia', 'Noah', 'Maya',
    'Chris', 'Dana', 'Kyle', 'Laila',
    'Tomas', 'Asha', 'Ben', 'Harper',
    'Zoey', 'Leo'
  ];
  v_ages integer[] := array[
    28, 34, 26, 31, 29, 42, 37, 25,
    32, 45, 27, 30, 33, 26, 38, 29,
    35, 41, 23, 36, 28, 31, 24, 39,
    27, 44
  ];
  v_genders text[] := array[
    'Man', 'Woman', 'Non-binary', 'Man',
    'Woman', 'Man', 'Woman', 'Man',
    'Woman', 'Man', 'Non-binary', 'Woman',
    'Man', 'Woman', 'Man', 'Woman',
    'Man', 'Woman', 'Man', 'Woman',
    'Man', 'Woman', 'Man', 'Woman',
    'Woman', 'Man'
  ];
  v_pronouns text[] := array[
    'he/him', 'she/her', 'they/them', 'he/him',
    'she/her', 'he/him', 'she/her', 'he/him',
    'she/her', 'he/him', 'they/them', 'she/her',
    'he/him', 'she/her', 'he/him', 'she/her',
    'he/him', 'she/her', 'he/him', 'she/her',
    'he/him', 'she/her', 'he/him', 'she/her',
    'she/her', 'he/him'
  ];
  v_cities text[] := array[
    'Cupertino, CA', 'San Francisco, CA', 'Mountain View, CA', 'Palo Alto, CA',
    'Scottsdale, AZ', 'Phoenix, AZ', 'Brooklyn, NY', 'Manhattan, NY',
    'San Jose, CA', 'Oakland, CA', 'Berkeley, CA', 'Sunnyvale, CA',
    'Tempe, AZ', 'Mesa, AZ', 'Queens, NY', 'Bronx, NY',
    'Chicago, IL', 'Evanston, IL', 'Oak Park, IL', 'Los Angeles, CA',
    'Santa Monica, CA', 'Pasadena, CA', 'Austin, TX', 'Round Rock, TX',
    'Denver, CO', 'Boulder, CO'
  ];
  v_lats numeric[] := array[
    37.323, 37.774, 37.386, 37.441,
    33.494, 33.448, 40.678, 40.783,
    37.335, 37.804, 37.871, 37.368,
    33.415, 33.415, 40.728, 40.844,
    41.878, 42.045, 41.885, 34.052,
    34.021, 34.147, 30.267, 30.508,
    39.739, 40.015
  ];
  v_lons numeric[] := array[
    -122.032, -122.419, -122.084, -122.143,
    -111.925, -112.074, -73.944, -73.966,
    -121.891, -122.271, -122.273, -122.036,
    -111.909, -111.831, -73.794, -73.865,
    -87.630, -87.688, -87.789, -118.244,
    -118.481, -118.144, -97.743, -97.679,
    -104.990, -105.270
  ];
  v_styles text[] := array[
    'competitive', 'relaxed', 'improvement', 'competitive',
    'relaxed', 'improvement', 'competitive', 'relaxed',
    'improvement', 'competitive', 'relaxed', 'improvement',
    'competitive', 'relaxed', 'improvement', 'relaxed',
    'competitive', 'relaxed', 'improvement', 'competitive',
    'relaxed', 'improvement', 'competitive', 'relaxed',
    'improvement', 'competitive'
  ];
  v_bios text[] := array[
    'Former college player. Looking for solid games in the Bay.',
    'Weekend warrior with more enthusiasm than skill.',
    'Working my way from 20s to single digits. Drills or rounds both good.',
    'Serious about scores, casual about everything else.',
    'Winter in AZ, open to playing new tracks.',
    'Grew up caddying. Now I just enjoy walking 18.',
    'NYC native. Love a good muni and a cold beer after.',
    'New to the game. Patient with mine, patient with yours.',
    'Left-handed. Tournament curious. Down for range sessions.',
    'Single-digit, walker, tee times before work.',
    'Beginner and loving it. Looking for chill partners.',
    'Rediscovering the game after ten years off.',
    'Big hitter, short game still in progress.',
    'Weekend mornings, par-3s, and a beer at 10am.',
    'Corporate tournaments got me back into it.',
    'Happy at any course as long as the people are good.',
    'Midwest grinder. Give me a cold March round any day.',
    'Moved to the suburbs, need people to tee it up with.',
    'Just graduated. Cheap rounds, late afternoons.',
    'Former junior competitor. Now I just play for fun.',
    'Sunset rounds on the coast are my thing.',
    'Fitness-first golfer. Walk every round.',
    'Tech job by day, obsessed by weekends.',
    'Dog friendly courses only, please.',
    'Rockies at altitude changes everything. Come learn with me.',
    'CU alum. Public golf advocate. Always looking for a game.'
  ];
  v_home_courses text[] := array[
    'Monarch Bay', 'TPC Harding Park', 'Deep Cliff', 'Stanford GC',
    'Talking Stick', 'Papago Golf Club', 'Dyker Beach', 'Van Cortlandt Park',
    'Cinnabar Hills', 'Metropolitan GL', 'Tilden Park', 'Baylands',
    'Ken McDonald', 'Longbow', 'Forest Park', 'Pelham Bay',
    'Jackson Park', 'Canal Shores', 'Columbus Park', 'Griffith Park',
    'Penmar', 'Brookside', 'Lions Muny', 'Forest Creek',
    'City Park', 'Flatirons'
  ];
  v_walking text[] := array[
    'walk','ride','either','walk','either','walk','ride','either',
    'walk','walk','either','ride','walk','ride','either','ride',
    'walk','either','walk','ride','walk','walk','either','ride',
    'walk','walk'
  ];
  v_holes text[] := array[
    '18','either','18','18','either','18','9','either',
    '18','18','either','18','18','9','either','9',
    '18','18','9','18','either','18','18','9',
    'either','18'
  ];
  v_pace text[] := array[
    'ready','chill','moderate','ready','chill','moderate','ready','chill',
    'moderate','ready','chill','moderate','ready','chill','moderate','chill',
    'ready','chill','moderate','ready','chill','moderate','ready','chill',
    'moderate','ready'
  ];
  v_betting text[] := array[
    'small','no','small','yes','no','small','no','no',
    'small','yes','no','small','yes','no','small','no',
    'small','no','no','yes','no','small','yes','no',
    'small','small'
  ];
  v_drinks text[] := array[
    'sometimes','yes','sometimes','no','yes','sometimes','yes','sometimes',
    'sometimes','no','yes','sometimes','no','yes','sometimes','yes',
    'sometimes','yes','sometimes','no','yes','sometimes','yes','sometimes',
    'yes','sometimes'
  ];
  v_post_round text[] := array[
    'hangout','hangout','just_round','hangout','hangout','just_round','hangout','hangout',
    'hangout','just_round','hangout','hangout','just_round','hangout','hangout','hangout',
    'hangout','hangout','just_round','hangout','hangout','hangout','hangout','hangout',
    'hangout','hangout'
  ];
  v_teaching text[] := array[
    'just_play','open_to_tips','open_to_tips','just_play','open_to_tips','just_play','open_to_tips','open_to_tips',
    'open_to_tips','just_play','open_to_tips','open_to_tips','just_play','open_to_tips','open_to_tips','open_to_tips',
    'just_play','open_to_tips','open_to_tips','just_play','open_to_tips','open_to_tips','just_play','open_to_tips',
    'open_to_tips','just_play'
  ];
  u_id uuid;
  i integer;
begin
  for i in 1..array_length(v_emails, 1) loop
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
      v_emails[i],
      now(),
      crypt('seedpassword-not-for-real-login', gen_salt('bf')),
      '{}'::jsonb,
      '{"provider":"email","providers":["email"]}'::jsonb,
      now(),
      now()
    );

    -- The on_auth_user_created trigger already inserted an empty profile
    -- row for u_id; now populate it with the seed data.
    update public.profiles set
      display_name = v_names[i],
      age = v_ages[i],
      gender = v_genders[i],
      pronouns = v_pronouns[i],
      bio = v_bios[i],
      home_city = v_cities[i],
      home_course_name = v_home_courses[i],
      home_location = ST_SetSRID(ST_MakePoint(v_lons[i], v_lats[i]), 4326)::geography,
      has_handicap = (i % 2 = 0),
      handicap = case
        when i % 2 = 0 then (1 + ((i * 1.9)::numeric(4,1)))::numeric(3,1)
        else null
      end,
      years_playing = 2 + ((i * 7) % 25),
      walking_preference = v_walking[i],
      holes_preference = v_holes[i],
      pace = v_pace[i],
      betting = v_betting[i],
      drinks = v_drinks[i],
      post_round = v_post_round[i],
      teaching_mindset = v_teaching[i],
      style_default = v_styles[i],
      photo_urls = array[
        'https://picsum.photos/seed/pindr' || i || 'a/800/1000',
        'https://picsum.photos/seed/pindr' || i || 'b/800/1000'
      ],
      onboarded_at = now()
    where user_id = u_id;
  end loop;
end $$;

-- Quick sanity check — run the below in the SQL editor after seeding
-- to confirm the 26 profiles landed:
--   select display_name, home_city, style_default
--   from public.profiles
--   where user_id in (
--     select id from auth.users where email like '%@pindr.test'
--   )
--   order by home_city;
