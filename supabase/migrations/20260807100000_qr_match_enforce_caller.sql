-- Security fix: create_match_from_qr previously trusted its scanner_id
-- argument, which let any authenticated caller create a match between
-- two arbitrary users (no consent from either side, and it opened a
-- chat between them).
--
-- The signature is intentionally unchanged — the shipped 1.0 client
-- passes scanner_id explicitly — but the function now rejects any call
-- where scanner_id is not the authenticated caller, so the argument can
-- no longer be spoofed. Legitimate clients always pass their own id and
-- are unaffected.

create or replace function public.create_match_from_qr(
  scanner_id uuid,
  scanned_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  lo uuid;
  hi uuid;
  result_id uuid;
begin
  -- The caller may only act as themselves.
  if auth.uid() is null or scanner_id is distinct from auth.uid() then
    raise exception 'unavailable';
  end if;

  if scanner_id is null or scanned_user_id is null then
    raise exception 'unavailable';
  end if;

  if scanner_id = scanned_user_id then
    raise exception 'self_scan';
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = scanner_id and b.blocked_id = scanned_user_id)
       or (b.blocker_id = scanned_user_id and b.blocked_id = scanner_id)
  ) then
    raise exception 'blocked';
  end if;

  if not exists (
    select 1 from public.profiles
    where user_id = scanned_user_id
      and onboarded_at is not null
  ) then
    raise exception 'unavailable';
  end if;

  lo := least(scanner_id, scanned_user_id);
  hi := greatest(scanner_id, scanned_user_id);

  insert into public.matches (user_a_id, user_b_id, source)
  values (lo, hi, 'qr')
  on conflict (user_a_id, user_b_id) do nothing
  returning id into result_id;

  if result_id is null then
    select id into result_id
    from public.matches
    where user_a_id = lo and user_b_id = hi;
  end if;

  return result_id;
end;
$$;
