-- Interests table with a seed set of common tags, plus a junction
-- table for the many-to-many between profiles and interests.

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.profile_interests (
  profile_user_id uuid not null references public.profiles(user_id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_user_id, interest_id)
);

alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;

-- Interests catalog is readable by any signed-in user.
create policy "Anyone signed in can read interests"
  on public.interests
  for select
  to authenticated
  using (true);

-- Users manage their own profile_interests rows.
create policy "Users can read their own profile_interests"
  on public.profile_interests
  for select
  using (auth.uid() = profile_user_id);

create policy "Users can add their own profile_interests"
  on public.profile_interests
  for insert
  with check (auth.uid() = profile_user_id);

create policy "Users can remove their own profile_interests"
  on public.profile_interests
  for delete
  using (auth.uid() = profile_user_id);

-- Seed a small curated set. Adding more later is just inserts.
insert into public.interests (name) values
  ('Hiking'),
  ('Craft beer'),
  ('Live music'),
  ('Travel'),
  ('Family'),
  ('Fitness'),
  ('Cooking'),
  ('Running'),
  ('Fishing'),
  ('Reading'),
  ('Dogs'),
  ('Coffee'),
  ('Movies'),
  ('Gaming'),
  ('Yoga'),
  ('Cycling'),
  ('Photography'),
  ('Volunteering')
on conflict (name) do nothing;
