-- Waitlist signups for the pindrgolf.com landing page.
--
-- Security model: the public page inserts with the anon key; nobody can
-- read, update, or delete through the API at all (no select/update/
-- delete policies exist). You read the list from the Supabase dashboard
-- (Table Editor -> waitlist_signups -> Export CSV) when it's time to
-- send the launch email.

create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (length(trim(first_name)) between 1 and 80),
  last_name text not null check (length(trim(last_name)) between 1 and 80),
  email text not null check (
    length(email) <= 255
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  city_state text not null check (length(trim(city_state)) between 2 and 120),
  source text not null default 'pindrgolf.com',
  created_at timestamptz not null default now()
);

-- One row per email; the page treats a duplicate as success ("you're
-- already in") rather than an error.
create unique index waitlist_signups_email_idx
  on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;

create policy "Anyone can join the waitlist"
  on public.waitlist_signups
  for insert
  to anon, authenticated
  with check (true);

-- No select/update/delete policies on purpose: with RLS enabled and no
-- policy, the API can write but never read the list back.
