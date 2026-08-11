-- Data-audit fix #3: record push opens.
--
-- notifications_log knows a push was sent and the app navigates on tap
-- (lib/push/deep-linking.ts), but the tap is never written back — so
-- push open rate is uncomputable. The push payload now carries the log
-- row's id (see _shared/notify.ts); the tap handler calls this RPC.
--
-- opened_at semantics: first tap wins. Repeat taps of the same
-- notification (or a cold-start replay of the last tap) are no-ops, so
-- open timing stays honest.

alter table public.notifications_log
  add column if not exists opened_at timestamptz;

create or replace function public.mark_notification_opened(p_notification_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications_log
  set opened_at = now()
  where id = p_notification_id
    and user_id = auth.uid()      -- only the recipient can mark it
    and opened_at is null;        -- first tap wins
$$;

-- Advisor-hardening default privileges strip PUBLIC execute from new
-- functions, so the app's role needs this explicit grant.
grant execute on function public.mark_notification_opened(uuid) to authenticated;
