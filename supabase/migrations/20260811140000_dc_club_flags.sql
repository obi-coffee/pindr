-- Phase C follow-up: the national course seed already contained the
-- DC-area private clubs — with is_public wrongly true (Congressional
-- listed as a public course). The 20260811130100 seed's name-only
-- guard therefore skipped them, and also skipped Woodmont (Rockville)
-- because same-named courses exist in FL/GA. Verified against the
-- live data 2026-08-11.
--
-- Scoped by (name, state) throughout: "Columbia Country Club" also
-- exists in MO and SC, "Woodmont Country Club" in FL — those rows are
-- untouched. (The profile backfill required globally-unique names, so
-- no profile got linked across states.)

update public.courses set is_public = false
where (lower(name), state) in (
  ('congressional country club',       'MD'),
  ('columbia country club',            'MD'),
  ('kenwood golf & country club',      'MD'),
  ('bethesda country club',            'MD'),
  ('army navy country club',           'VA'),  -- both campuses
  ('washington golf and country club', 'VA'),
  ('belle haven country club',         'VA')
);

-- National-seed typo, visible in the picker's subtitle line.
update public.courses set city = 'Bethesda'
where lower(name) = 'congressional country club'
  and state = 'MD' and city = 'Besthesda';

-- Woodmont (Rockville) — guard scoped to the state this time.
insert into public.courses (name, city, state, country, location, is_public)
select 'Woodmont Country Club', 'Rockville', 'MD', 'US',
       ST_SetSRID(ST_MakePoint(-77.1330, 39.0640), 4326)::geography, false
where not exists (
  select 1 from public.courses c
  where lower(c.name) = 'woodmont country club' and c.state = 'MD'
);
