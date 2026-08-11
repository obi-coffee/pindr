-- Data-audit fix #1: record that a user opened the app.
--
-- A user who signs in, browses the deck without swiping, reads old
-- chats, and closes the app writes zero rows — so DAU, retention
-- curves, and "who's gone quiet" are uncomputable. This adds the
-- last_active_at column the admin plan's HERE TODAY tile already
-- assumes exists, plus a tiny RPC the app calls on foreground
-- (throttled client-side to once per hour; a missed call is fine).

alter table public.profiles
  add column if not exists last_active_at timestamptz;

-- Writes only the caller's own row; a signed-out call matches nothing.
create or replace function public.touch_last_active()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set last_active_at = now()
  where user_id = auth.uid();
$$;

-- Advisor-hardening default privileges strip PUBLIC execute from new
-- functions, so the app's role needs this explicit grant.
grant execute on function public.touch_last_active() to authenticated;
