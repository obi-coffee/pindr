-- 1.0.1 Phase C: starter list of DC-area private clubs.
--
-- Same pattern as the 20260421120100 courses seed (courses ship as
-- migrations, not loose seed files), guarded per-row so reruns are
-- no-ops. is_public = false is what marks a club as private — Phase D
-- renders the "member club" tag from it.
--
-- Coordinates are approximate clubhouse locations; they only feed the
-- distance sort in the course picker. Until the admin portal exists,
-- adding more clubs is a SQL-editor task (copy a row below).
--
-- These rows appear in every course search, including the round
-- composer — accepted in Phase C Step 0 (members can post rounds at
-- their club).

insert into public.courses (name, city, state, country, location, is_public)
select v.name, v.city, v.state, 'US',
       ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography, false
from (values
  ('Congressional Country Club',        'Bethesda',   'MD', -77.1747, 39.0024),
  ('Chevy Chase Club',                  'Chevy Chase','MD', -77.0786, 38.9737),
  ('Columbia Country Club',             'Chevy Chase','MD', -77.0740, 38.9822),
  ('Burning Tree Club',                 'Bethesda',   'MD', -77.1601, 38.9975),
  ('Kenwood Golf & Country Club',       'Bethesda',   'MD', -77.1150, 38.9666),
  ('Bethesda Country Club',             'Bethesda',   'MD', -77.1470, 39.0136),
  ('Woodmont Country Club',             'Rockville',  'MD', -77.1330, 39.0640),
  ('TPC Potomac at Avenel Farm',        'Potomac',    'MD', -77.1850, 39.0230),
  ('Army Navy Country Club',            'Arlington',  'VA', -77.0720, 38.8570),
  ('Washington Golf and Country Club',  'Arlington',  'VA', -77.1240, 38.9050),
  ('Belle Haven Country Club',          'Alexandria', 'VA', -77.0570, 38.7800)
) as v(name, city, state, lng, lat)
where not exists (
  select 1 from public.courses c
  where lower(c.name) = lower(v.name)
);
