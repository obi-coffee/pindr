-- ============================================================
-- DO NOT APPLY YET — wait until app 1.0.1+ is what users run.
-- ============================================================
--
-- This is NOT in supabase/migrations on purpose: `supabase db push`
-- must not pick it up yet. Apply it manually (SQL editor or psql)
-- once 1.0.1 has shipped and older clients have mostly updated.
--
-- Why: the RLS policies that let matched users (and users you've
-- blocked) read a profiles row expose EVERY column, including
-- home_location — the exact lat/long point. RLS is row-level only,
-- so the fix is column-level privileges: the authenticated role
-- keeps select on every profiles column EXCEPT home_location.
-- Distances shown in the app already come from security-definer
-- functions (discover_candidates, get_profile_by_id), which are
-- unaffected and only ever return distance_km.
--
-- Why it must wait: the 1.0 client's AuthProvider fetches the
-- user's own profile with select('*'), which fails if the role
-- lacks select on any column. 1.0.1 switches it to an explicit
-- column list (already committed in lib/auth/AuthProvider.tsx).
--
-- NOTE for future migrations: after this, any new column added to
-- public.profiles is NOT client-readable until you grant select on
-- it explicitly, e.g.:
--   grant select (new_column) on table public.profiles to authenticated;
--
-- Deliberately NOT in the list below: home_location (the point of this
-- migration) and last_active_at (Phase B heartbeat — server-written,
-- nothing in the app reads it, and matched users shouldn't be able to
-- infer "last seen" from it).

revoke select on table public.profiles from anon, authenticated;

grant select (
  user_id,
  display_name,
  age,
  gender,
  pronouns,
  bio,
  home_city,
  home_course_name,
  home_course_id,
  can_host_guests,
  handicap,
  has_handicap,
  years_playing,
  walking_preference,
  holes_preference,
  pace,
  betting,
  drinks,
  post_round,
  teaching_mindset,
  style_default,
  photo_urls,
  profile_answers,
  availability,
  onboarded_at,
  created_at,
  updated_at
) on table public.profiles to authenticated;
