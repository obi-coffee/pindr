-- Phase 5c: notifications_log. Append-only audit of every push the server
-- attempts to send. Powers three things: the rolling 24-hour rate limit
-- (plan §2), the quiet-hours queue drain (plan §2), and debugging. Written
-- only by Edge Functions via the service role key; users can read their
-- own rows for a future in-app history view.

create table if not exists public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'failed')),
  sent_at timestamptz,
  delivered_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

-- (user_id, sent_at desc) powers the 24-hour rate-limit count.
create index if not exists notifications_log_user_sent_idx
  on public.notifications_log (user_id, sent_at desc);

-- (status, created_at) powers the quiet-hours queue drain.
create index if not exists notifications_log_status_created_idx
  on public.notifications_log (status, created_at);

alter table public.notifications_log enable row level security;

drop policy if exists "users read own notifications log" on public.notifications_log;
create policy "users read own notifications log"
  on public.notifications_log for select
  to authenticated
  using (user_id = auth.uid());
