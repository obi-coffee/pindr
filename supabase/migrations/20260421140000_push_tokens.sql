-- Phase 5c: push_tokens. One row per registered Expo push token per user.
-- A single user can have multiple tokens (phone + tablet). Tokens are
-- written by the client after the permission prompt (deferred until after
-- the user's first match or first posted round — see plan §6). Edge
-- Functions read across users via the service role key, which bypasses RLS.

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  device_name text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, token)
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "users read own push tokens" on public.push_tokens;
create policy "users read own push tokens"
  on public.push_tokens for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users insert own push tokens" on public.push_tokens;
create policy "users insert own push tokens"
  on public.push_tokens for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users update own push tokens" on public.push_tokens;
create policy "users update own push tokens"
  on public.push_tokens for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users delete own push tokens" on public.push_tokens;
create policy "users delete own push tokens"
  on public.push_tokens for delete
  to authenticated
  using (user_id = auth.uid());
