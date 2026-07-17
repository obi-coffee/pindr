-- Phase 5c Step 3: fan new `matches` rows out to the push-on-match
-- Edge Function. Uses pg_net to POST the row as JSON, mimicking the
-- Supabase Database Webhook payload shape so the function handler stays
-- portable (a dashboard-configured webhook could replace this trigger
-- without code changes).
--
-- The functions URL and service-role key are read from Supabase Vault,
-- NOT committed to the repo. Before the trigger fires successfully, an
-- operator must seed two secrets in the SQL editor:
--
--   select vault.create_secret(
--     'https://<project-ref>.functions.supabase.co',
--     'edge_functions_url'
--   );
--   select vault.create_secret('<service-role-jwt>', 'service_role_key');

create extension if not exists pg_net;

create or replace function public.notify_match_push()
returns trigger
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  functions_url text;
  service_role_key text;
  request_body jsonb;
begin
  select decrypted_secret into functions_url
    from vault.decrypted_secrets
    where name = 'edge_functions_url';
  select decrypted_secret into service_role_key
    from vault.decrypted_secrets
    where name = 'service_role_key';

  if functions_url is null or service_role_key is null then
    -- Soft-fail: new matches must still land even if push config is missing.
    raise warning 'notify_match_push: vault secrets not configured, skipping';
    return new;
  end if;

  request_body := jsonb_build_object(
    'type', 'INSERT',
    'table', 'matches',
    'record', to_jsonb(new)
  );

  perform net.http_post(
    url := functions_url || '/push-on-match',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || service_role_key
    ),
    body := request_body
  );

  return new;
end;
$$;

drop trigger if exists on_match_created_push on public.matches;
create trigger on_match_created_push
  after insert on public.matches
  for each row
  execute function public.notify_match_push();
