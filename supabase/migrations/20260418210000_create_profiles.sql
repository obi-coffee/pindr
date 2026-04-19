-- Profiles: one row per authenticated user, auto-created on signup.

create extension if not exists postgis;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Basics
  display_name text,
  age integer check (age is null or age >= 18),
  gender text,
  pronouns text,
  bio text,

  -- Location (populated in a later chunk)
  home_location geography(point, 4326),
  home_course_name text,

  -- Golf stats
  handicap numeric(3, 1),
  has_handicap boolean not null default false,
  years_playing integer check (years_playing is null or years_playing >= 0),

  -- Play-style preferences (text + check to allow adding values without enum migrations)
  walking_preference text check (walking_preference in ('walk', 'ride', 'either')),
  holes_preference text check (holes_preference in ('9', '18', 'either')),
  pace text check (pace in ('chill', 'moderate', 'ready')),
  betting text check (betting in ('yes', 'small', 'no')),
  drinks text check (drinks in ('yes', 'sometimes', 'no')),
  post_round text check (post_round in ('hangout', 'just_round')),
  teaching_mindset text check (teaching_mindset in ('open_to_tips', 'just_play')),
  style_default text check (style_default in ('relaxed', 'improvement', 'competitive')),

  -- Photos (populated in a later chunk)
  photo_urls text[] not null default '{}',

  -- Meta
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Row-level security: users see and edit only their own profile.
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id);

-- Auto-create an empty profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill profiles for any users that already exist (e.g., Phase 1 test accounts).
insert into public.profiles (user_id)
select id from auth.users
where id not in (select user_id from public.profiles);
