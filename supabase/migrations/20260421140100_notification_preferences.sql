-- Phase 5c: notification_preferences. One row per user with the four
-- controls surfaced in Settings → Notifications (matches, messages, rounds,
-- quiet hours). All categories default on after the OS-level permission
-- grant (plan §6). Quiet hours default 10pm–8am local. Timezone defaults
-- to America/Los_Angeles but is overwritten by the client on first token
-- registration using the device's resolved timezone.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  matches boolean not null default true,
  messages boolean not null default true,
  rounds boolean not null default true,
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '08:00',
  timezone text not null default 'America/Los_Angeles',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists "users read own notification prefs" on public.notification_preferences;
create policy "users read own notification prefs"
  on public.notification_preferences for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users update own notification prefs" on public.notification_preferences;
create policy "users update own notification prefs"
  on public.notification_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Auto-create a preferences row for every new auth user. Kept separate
-- from handle_new_user() (which owns profiles) so concerns stay isolated.
create or replace function public.handle_new_user_notification_prefs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_notification_prefs
  after insert on auth.users
  for each row
  execute function public.handle_new_user_notification_prefs();

-- Backfill: existing beta users get a preferences row with defaults.
insert into public.notification_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;
