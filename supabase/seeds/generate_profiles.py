#!/usr/bin/env python3
"""Regenerate supabase/seed.sql with DC-weighted mock profiles and
Unsplash photos of real people playing golf.

Usage:
    export UNSPLASH_ACCESS_KEY=...
    python3 supabase/seeds/generate_profiles.py

Outputs: supabase/seed.sql (overwritten)

~70% of profiles are in the DC metro area; the rest are scattered in
NYC / SF / LA so filters and travel mode still have something to
exercise. Photos come from six targeted Unsplash searches — "golfer",
"woman golfer", "golf player portrait", etc. — pooled and randomly
assigned 2-3 per profile.

Free-tier Unsplash keys allow 50 requests/hour; this script fires six.
"""

from __future__ import annotations

import json
import os
import random
import sys
import textwrap
import urllib.parse
import urllib.request
from pathlib import Path

ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY")
if not ACCESS_KEY:
    sys.exit("UNSPLASH_ACCESS_KEY not set. Export it before running.")

RANDOM_SEED = 42  # keep output stable across runs unless pool changes
random.seed(RANDOM_SEED)

OUTPUT = Path(__file__).resolve().parent.parent / "seed.sql"

PHOTO_QUERIES = [
    "golfer",
    "golf player",
    "woman golfer",
    "man golfing",
    "playing golf",
    "golf course person",
]

# ---------------------------------------------------------------------------
# Profile pool
# ---------------------------------------------------------------------------

DC_METRO = [
    # (city_label, lat, lon)
    ("Washington, DC",        38.9072, -77.0369),
    ("Washington, DC",        38.9281, -77.0278),  # Columbia Heights
    ("Washington, DC",        38.9069, -77.0712),  # Georgetown
    ("Washington, DC",        38.8816, -76.9956),  # SE DC
    ("Arlington, VA",         38.8799, -77.1067),
    ("Arlington, VA",         38.8871, -77.0946),  # Rosslyn
    ("Alexandria, VA",        38.8048, -77.0469),
    ("Alexandria, VA",        38.8321, -77.0838),  # Del Ray
    ("Bethesda, MD",          38.9847, -77.0947),
    ("Bethesda, MD",          38.9951, -77.1002),  # North
    ("Silver Spring, MD",     38.9907, -77.0261),
    ("Silver Spring, MD",     39.0126, -77.0233),  # Downtown
    ("Chevy Chase, MD",       38.9685, -77.0728),
    ("Rockville, MD",         39.0840, -77.1528),
    ("Takoma Park, MD",       38.9779, -77.0075),
    ("Hyattsville, MD",       38.9559, -76.9455),
    ("Falls Church, VA",      38.8823, -77.1711),
    ("Fairfax, VA",           38.8462, -77.3064),
    ("McLean, VA",            38.9339, -77.1773),
    ("Vienna, VA",            38.9012, -77.2653),
    ("Herndon, VA",           38.9696, -77.3861),
    ("Reston, VA",            38.9586, -77.3570),
]

ELSEWHERE = [
    ("Brooklyn, NY",          40.6782, -73.9442),
    ("Manhattan, NY",         40.7831, -73.9712),
    ("Queens, NY",            40.7282, -73.7949),
    ("Jersey City, NJ",       40.7178, -74.0431),
    ("San Francisco, CA",     37.7749, -122.4194),
    ("Oakland, CA",           37.8044, -122.2712),
    ("Berkeley, CA",          37.8716, -122.2727),
    ("Los Angeles, CA",       34.0522, -118.2437),
    ("Santa Monica, CA",      34.0195, -118.4912),
    ("Pasadena, CA",          34.1478, -118.1445),
]

DC_COURSES = [
    "East Potomac Golf Links",
    "Rock Creek Park Golf Course",
    "Langston Golf Course",
    "Fort Belvoir GC",
    "Army Navy Country Club",
    "Sligo Creek Golf Course",
    "Northwest Park Golf Course",
    "Falls Road Golf Course",
    "Needwood Golf Course",
    "Redgate Golf Course",
    "Reston National GC",
    "University of Maryland GC",
    "Fairfax National",
    "Manassas Park GC",
    "Trump National DC",  # yes, controversial. recognizable.
    "Congressional Country Club",  # mostly private; familiar name
    "Chevy Chase Club",
]

OTHER_COURSES = [
    "Dyker Beach", "Van Cortlandt Park", "Pelham Bay", "Forest Park",
    "TPC Harding Park", "Metropolitan GL", "Tilden Park", "Monarch Bay",
    "Griffith Park", "Penmar", "Brookside", "Rancho Park",
]

FIRST_NAMES = [
    "Alex", "Sam", "Jordan", "Casey", "Riley", "Morgan", "Quinn", "Taylor",
    "Priya", "Marcus", "Jamie", "Devi", "Eli", "Sophia", "Noah", "Maya",
    "Chris", "Dana", "Kyle", "Laila", "Tomas", "Asha", "Ben", "Harper",
    "Zoey", "Leo", "Nina", "Omar", "Carmen", "Isaiah", "Mia", "Raj",
    "Sasha", "Theo", "Aisha", "Jaden", "Farah", "Luis", "Adaora", "Cole",
    "Tyra", "Simon", "Esther", "Malik", "Lin", "Darius", "Kira", "Xavier",
    "Layla", "Nico", "Imani", "Arjun", "Talia", "Beau", "Gia", "Kenji",
    "Selena", "Ravi", "Diego", "Yara",
]

DC_BIOS = [
    "Hill staffer. Weekend rounds only. Hains Point my happy place.",
    "Rock Creek on lunch breaks. Slow and steady.",
    "Moved here from NYC. Learning the DMV scene.",
    "Army Navy member. Down for guest rounds on weekends.",
    "East Potomac three times a week in summer. Say hi.",
    "Grad student at Georgetown. Cheap tee times, late afternoons.",
    "Been on 16th hole at Langston most weekends since 2019.",
    "Pentagon by day. Fort Belvoir when schedule allows.",
    "NoVa mom. Reston National with the kids when they're free.",
    "Transplant from Texas. Courses here are a gift.",
    "Swing coach on the side. Open to tips or just play.",
    "Crown Golf in Rockville is underrated. Fight me.",
    "Walking-only. Usually at Sligo Creek or Northwest Park.",
    "Just want a foursome that doesn't take six hours.",
    "Single-digit, looking for a regular game.",
    "Got into golf during COVID. Playing catch-up.",
    "Softball in summer, golf the rest of the year.",
    "Bethesda regular. Falls Road is home.",
    "Left-handed. Tournament curious. Let's build something.",
    "Corporate tournaments got me hooked. Now I play every weekend.",
    "Morning person. 6am tee times or bust.",
    "DC native. Watched the Langston renovation happen.",
]

OTHER_BIOS = [
    "Former college player. Looking for solid games locally.",
    "Beginner and loving it. Patient with me and I'll be patient with you.",
    "Muni golfer forever. Give me a 20-buck round and I'm happy.",
    "Sunset rounds on the coast are my thing.",
    "Grew up caddying. Now I just enjoy walking 18.",
    "Working my way from 20s to single digits.",
    "Weekend warrior with more enthusiasm than skill.",
    "Rediscovering the game after ten years off.",
    "Big hitter, short game still in progress.",
    "Just want people who take the game seriously but not themselves.",
]

# ---------------------------------------------------------------------------
# Unsplash
# ---------------------------------------------------------------------------


def fetch_unsplash_urls(query: str, per_page: int = 30) -> list[str]:
    url = (
        "https://api.unsplash.com/search/photos?"
        + urllib.parse.urlencode({"query": query, "per_page": per_page})
    )
    req = urllib.request.Request(url, headers={
        "Authorization": f"Client-ID {ACCESS_KEY}",
        "Accept-Version": "v1",
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read())
    except Exception as err:
        sys.exit(f"Unsplash fetch failed for '{query}': {err}")
    results = data.get("results", [])
    urls = []
    for r in results:
        # Use the "regular" size (~1080px wide) — good enough for card
        # display, not enormous.
        u = r.get("urls", {}).get("regular")
        if u:
            urls.append(u)
    return urls


def build_photo_pool() -> list[str]:
    pool: list[str] = []
    seen: set[str] = set()
    for q in PHOTO_QUERIES:
        for u in fetch_unsplash_urls(q, per_page=30):
            if u not in seen:
                pool.append(u)
                seen.add(u)
    if len(pool) < 60:
        sys.exit(
            f"Only {len(pool)} unique photos — Unsplash returned fewer than "
            "expected. Tweak PHOTO_QUERIES or try again."
        )
    random.shuffle(pool)
    return pool


# ---------------------------------------------------------------------------
# Profile synthesis
# ---------------------------------------------------------------------------

TOTAL_PROFILES = 60
DC_RATIO = 0.70


def jitter(coord: float, amount: float = 0.01) -> float:
    return round(coord + random.uniform(-amount, amount), 5)


def make_profile(index: int, pool: list[str]) -> dict:
    is_dc = index < int(TOTAL_PROFILES * DC_RATIO)
    first = FIRST_NAMES[index % len(FIRST_NAMES)]
    # slug from first name + index for email uniqueness
    email = f"{first.lower()}{index + 1}.seed@pindr.test"

    if is_dc:
        city, lat, lon = random.choice(DC_METRO)
        home_course = random.choice(DC_COURSES)
        bio = random.choice(DC_BIOS)
    else:
        city, lat, lon = random.choice(ELSEWHERE)
        home_course = random.choice(OTHER_COURSES)
        bio = random.choice(OTHER_BIOS)

    # Pick 2-3 photos from the shared pool. Fallback cycles the pool if we
    # run out (shouldn't happen at 60 profiles × 3 photos = 180 needs vs 120+
    # in pool).
    n_photos = random.choice([2, 2, 3])
    photos = [pool[(index * 3 + k) % len(pool)] for k in range(n_photos)]

    age = random.choice([23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 40, 42, 44])
    gender = random.choices(
        ["Man", "Woman", "Non-binary"],
        weights=[0.55, 0.40, 0.05],
    )[0]
    pronouns = {
        "Man": "he/him",
        "Woman": "she/her",
        "Non-binary": "they/them",
    }[gender]

    has_handicap = random.random() < 0.65
    handicap = round(random.uniform(3.0, 28.0), 1) if has_handicap else None

    return {
        "email": email,
        "name": first,
        "age": age,
        "gender": gender,
        "pronouns": pronouns,
        "bio": bio,
        "city": city,
        "lat": jitter(lat),
        "lon": jitter(lon),
        "home_course": home_course,
        "has_handicap": has_handicap,
        "handicap": handicap,
        "years_playing": random.choice([2, 3, 5, 6, 8, 10, 12, 15, 18, 20, 25]),
        "walking": random.choice(["walk", "ride", "either"]),
        "holes": random.choice(["9", "18", "either"]),
        "pace": random.choice(["chill", "moderate", "ready"]),
        "betting": random.choice(["yes", "small", "no"]),
        "drinks": random.choice(["yes", "sometimes", "no"]),
        "post_round": random.choice(["hangout", "just_round"]),
        "teaching": random.choice(["open_to_tips", "just_play"]),
        "style": random.choice(["relaxed", "improvement", "competitive"]),
        "photos": photos,
    }


# ---------------------------------------------------------------------------
# SQL rendering
# ---------------------------------------------------------------------------


def sql_literal(value: object) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    # string
    return "'" + str(value).replace("'", "''") + "'"


def render_array(values: list[str]) -> str:
    return "array[" + ", ".join(sql_literal(v) for v in values) + "]"


def render_sql(profiles: list[dict]) -> str:
    header = textwrap.dedent(
        """\
        -- Dev seed: populates public.profiles with mock users weighted toward
        -- Washington, DC metro (~70%) with the rest scattered in NYC/SF/LA so
        -- filters and travel mode still have something to exercise. Run from
        -- the Supabase SQL editor. Re-running first deletes any previous seed
        -- users (identified by @pindr.test) so you end with exactly the set
        -- defined below.
        --
        -- This file is GENERATED by supabase/seeds/generate_profiles.py.
        -- To regenerate with fresh photos:
        --   export UNSPLASH_ACCESS_KEY=...
        --   python3 supabase/seeds/generate_profiles.py
        --
        -- Photos are from Unsplash, licensed for free use (including
        -- commercial) under the Unsplash License.

        create extension if not exists pgcrypto;

        delete from auth.users where email like '%@pindr.test';

        """
    )

    body = []
    for p in profiles:
        body.append(f"""
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
    {sql_literal(p["email"])},
    now(),
    crypt('seedpassword-not-for-real-login', gen_salt('bf')),
    '{{}}'::jsonb,
    '{{"provider":"email","providers":["email"]}}'::jsonb,
    now(),
    now()
  );

  update public.profiles set
    display_name = {sql_literal(p["name"])},
    age = {p["age"]},
    gender = {sql_literal(p["gender"])},
    pronouns = {sql_literal(p["pronouns"])},
    bio = {sql_literal(p["bio"])},
    home_city = {sql_literal(p["city"])},
    home_course_name = {sql_literal(p["home_course"])},
    home_location = ST_SetSRID(ST_MakePoint({p["lon"]}, {p["lat"]}), 4326)::geography,
    has_handicap = {sql_literal(p["has_handicap"])},
    handicap = {sql_literal(p["handicap"])},
    years_playing = {p["years_playing"]},
    walking_preference = {sql_literal(p["walking"])},
    holes_preference = {sql_literal(p["holes"])},
    pace = {sql_literal(p["pace"])},
    betting = {sql_literal(p["betting"])},
    drinks = {sql_literal(p["drinks"])},
    post_round = {sql_literal(p["post_round"])},
    teaching_mindset = {sql_literal(p["teaching"])},
    style_default = {sql_literal(p["style"])},
    photo_urls = {render_array(p["photos"])},
    onboarded_at = now()
  where user_id = u_id;
end $$;
""")

    footer = textwrap.dedent(
        """
        -- Quick sanity check:
        --   select home_city, count(*)
        --   from public.profiles
        --   where user_id in (select id from auth.users where email like '%@pindr.test')
        --   group by home_city order by count(*) desc;
        """
    )

    return header + "".join(body) + footer


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    print(f"Fetching Unsplash photo pool ({len(PHOTO_QUERIES)} queries)…")
    pool = build_photo_pool()
    print(f"  → {len(pool)} unique photos in pool.")

    profiles = [make_profile(i, pool) for i in range(TOTAL_PROFILES)]
    dc_count = sum(1 for p in profiles if "DC" in p["city"] or "MD" in p["city"] or "VA" in p["city"])
    print(f"Generated {len(profiles)} profiles ({dc_count} DC metro).")

    sql = render_sql(profiles)
    OUTPUT.write_text(sql)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
