-- Broadcast inserts on public.messages through Supabase Realtime so
-- the chat thread can subscribe to new messages. Idempotent: skips
-- the alter if the table is already in the publication.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;
