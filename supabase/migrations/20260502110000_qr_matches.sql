-- Phase 3 of pre-resubmit plan: QR-code matching. A scanner reads
-- another user's QR (payload `pindr://match/<uuid>`), confirms in-app,
-- and the server inserts a confirmed match — no swipe state involved.
--
-- matches.source distinguishes how each row landed: the existing
-- swipe trigger writes 'swipe' (the new column default), QR writes
-- 'qr', and 'open_round' is reserved for a future round-confirm flow.

alter table public.matches
  add column if not exists source text not null default 'swipe'
    check (source in ('swipe', 'open_round', 'qr'));

-- Idempotent: scanning the same code twice returns the same match
-- id rather than failing on the unique constraint.
--
-- Errors (raised as 'self_scan' / 'blocked' / 'unavailable') are
-- mapped to user-facing copy by the confirm screen.

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

grant execute on function public.create_match_from_qr(uuid, uuid) to authenticated;
