-- 1.0.1 Phase C: home course as a structured link.
--
-- profiles.home_course_name (free text, collected since onboarding
-- launched) stays — it's the display cache every surface already
-- renders (swipe card, profile views, discover RPCs). This adds the
-- structured id underneath it: the picker writes both, and Phase D's
-- regulars feature matches on the id, never the text.
--
-- can_host_guests lands here too (schema in one migration, per plan);
-- it stays dormant until Phase D's profile-edit toggle.
--
-- No is_private column: courses.is_public already models it — a
-- private club is a courses row with is_public = false (see the
-- 20260811130100 club seed).

alter table public.profiles
  add column if not exists home_course_id uuid
    references public.courses(id) on delete set null,
  add column if not exists can_host_guests boolean not null default false;

-- Phase D queries "who else calls this course home" by this column.
create index if not exists profiles_home_course_idx
  on public.profiles (home_course_id);

-- Backfill: link existing free-text names that match exactly one
-- course (globally unique name, case/whitespace-insensitive).
-- Ambiguous or unmatched names stay text-only until the user re-picks.
update public.profiles p
set home_course_id = m.course_id
from (
  select lower(trim(c.name)) as key, min(c.id::text)::uuid as course_id
  from public.courses c
  group by lower(trim(c.name))
  having count(*) = 1
) m
where p.home_course_id is null
  and p.home_course_name is not null
  and lower(trim(p.home_course_name)) = m.key;

-- Client column privileges: nothing to do here TODAY (profiles still
-- has table-wide select), but pending/APPLY-AFTER-1.0.1 switches to an
-- explicit column grant list — home_course_id and can_host_guests are
-- added to that list in the same commit as this migration.
