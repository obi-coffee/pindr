-- Messages, per-user read state, and a list_matches RPC that returns
-- one row per match with the other user's profile snippet, the last
-- message preview, and an unread count for the caller.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) > 0 and length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index messages_match_created_idx
  on public.messages (match_id, created_at desc);

alter table public.messages enable row level security;

create policy "Users can read messages in their matches"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

create policy "Users can send messages in their matches"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

-- Per-user read pointer for each match.
create table public.match_reads (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

alter table public.match_reads enable row level security;

create policy "Users can read their own match_reads"
  on public.match_reads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own match_reads"
  on public.match_reads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own match_reads"
  on public.match_reads for update
  using (auth.uid() = user_id);

-- Profile peek policy: let a user read another user's profile row if they
-- are matched. Needed for Matches list + chat header avatars.
create policy "Users can read profiles of their matches"
  on public.profiles for select
  using (
    exists (
      select 1 from public.matches m
      where (m.user_a_id = auth.uid() and m.user_b_id = profiles.user_id)
         or (m.user_b_id = auth.uid() and m.user_a_id = profiles.user_id)
    )
  );

-- One-row-per-match summary for the Matches tab.
create or replace function public.list_matches()
returns table (
  match_id uuid,
  matched_at timestamptz,
  other_user_id uuid,
  other_display_name text,
  other_photo_url text,
  last_message text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  unread_count integer
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return query
  with my_matches as (
    select
      m.id as match_id,
      m.created_at as matched_at,
      case
        when m.user_a_id = auth.uid() then m.user_b_id
        else m.user_a_id
      end as other_user_id
    from public.matches m
    where m.user_a_id = auth.uid() or m.user_b_id = auth.uid()
  ),
  latest as (
    select distinct on (msg.match_id)
      msg.match_id,
      msg.body,
      msg.created_at,
      msg.sender_id
    from public.messages msg
    where msg.match_id in (select mm.match_id from my_matches mm)
    order by msg.match_id, msg.created_at desc
  )
  select
    mm.match_id,
    mm.matched_at,
    mm.other_user_id,
    p.display_name,
    (p.photo_urls)[1],
    latest.body,
    latest.created_at,
    latest.sender_id,
    coalesce((
      select count(*)::integer
      from public.messages msg
      left join public.match_reads mr
        on mr.match_id = msg.match_id and mr.user_id = auth.uid()
      where msg.match_id = mm.match_id
        and msg.sender_id <> auth.uid()
        and (mr.last_read_at is null or msg.created_at > mr.last_read_at)
    ), 0) as unread_count
  from my_matches mm
  left join public.profiles p on p.user_id = mm.other_user_id
  left join latest on latest.match_id = mm.match_id
  order by coalesce(latest.created_at, mm.matched_at) desc;
end;
$$;

grant execute on function public.list_matches() to authenticated;
