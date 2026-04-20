-- User reports: reporter flags someone for moderation. Admins handle
-- review via the service role; regular users can only create reports
-- and see their own.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (
    reason in ('spam', 'harassment', 'fake_profile', 'safety', 'other')
  ),
  details text,
  status text not null default 'open' check (
    status in ('open', 'reviewed', 'closed')
  ),
  created_at timestamptz not null default now(),
  constraint reports_not_self check (reporter_id <> reported_id)
);

create index reports_reporter_idx on public.reports (reporter_id);
create index reports_reported_idx on public.reports (reported_id);

alter table public.reports enable row level security;

create policy "Users can submit their own reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users can read their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);
