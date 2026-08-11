-- Hardening based on the Supabase Security Advisor run (2026-08-07).
--
-- 1) RPCs were executable by anonymous clients. Postgres grants EXECUTE
--    to PUBLIC on new functions by default, so despite our explicit
--    "grant ... to authenticated" statements, anyone with the anon key
--    could also call them. Most guard with auth.uid(), but e.g.
--    get_profile_by_id would return a full profile card to an anonymous
--    caller. Every function the app calls has an explicit authenticated
--    grant (verified against the client's .rpc() calls), so revoking
--    PUBLIC/anon is safe for the shipped app.
--
-- 2) The photos bucket had a broad SELECT policy ("Anyone can view
--    photos") which let anonymous clients LIST every file in the bucket
--    — i.e. enumerate all user ids and all their photo files. Public
--    buckets serve files by URL without any SELECT policy, so dropping
--    it keeps existing photo URLs working while removing enumeration.
--    Filenames contain a timestamp + random slug, so without listing
--    they are not guessable.
--
-- 3) set_updated_at (and any other non-extension function without a
--    pinned search_path) gets `set search_path = public`, closing the
--    "Function Search Path Mutable" warnings.

-- (3) Pin search_path on public-schema functions that don't set one.
--     Extension-owned functions (PostGIS etc.) are excluded.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) c
        where c like 'search_path=%'
      )
      and not exists (
        select 1 from pg_depend d
        where d.objid = p.oid and d.deptype = 'e'
      )
  loop
    execute format('alter function %s set search_path = public', f.sig);
  end loop;
end $$;

-- (1) Revoke anonymous execution on all non-extension public functions.
--     authenticated keeps its explicit grants; extension functions
--     (PostGIS etc.) are left untouched.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and not exists (
        select 1 from pg_depend d
        where d.objid = p.oid and d.deptype = 'e'
      )
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
  end loop;
end $$;

-- Functions created by future migrations won't get the default PUBLIC
-- execute grant either.
alter default privileges in schema public revoke execute on functions from public;

-- (2) Stop anonymous listing of the photos bucket. Photo delivery uses
--     the public-bucket URL endpoint, which does not consult this policy.
drop policy if exists "Anyone can view photos" on storage.objects;
