-- Phase C follow-up #2: Woodmont Country Club (Rockville, MD) was in
-- the national seed all along, flagged public — the previous
-- migration's insert was correctly skipped by its guard, but the flag
-- fix list didn't include it. Close the loop.

update public.courses set is_public = false
where lower(name) = 'woodmont country club' and state = 'MD';
