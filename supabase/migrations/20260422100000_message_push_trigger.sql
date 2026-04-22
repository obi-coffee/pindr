-- Phase 5c Step 4 (commit 1/2): generic notify_push helper + messages trigger.
--
-- notify_push(function_name, payload) is the shared SQL primitive every
-- push trigger now calls. It reads the functions URL and service-role key
-- from Supabase Vault and POSTs via pg_net. The existing notify_match_push
-- function will continue to work unchanged for now; new triggers use
-- notify_push directly and future cleanup can migrate match over.

create extension if not exists pg_net;

create or replace function public.notify_push(
  function_name text,
  payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  functions_url text;
  service_role_key text;
begin
  select decrypted_secret into functions_url
    from vault.decrypted_secrets
    where name = 'edge_functions_url';
  select decrypted_secret into service_role_key
    from vault.decrypted_secrets
    where name = 'service_role_key';

  if functions_url is null or service_role_key is null then
    raise warning 'notify_push: vault secrets not configured, skipping';
    return;
  end if;

  perform net.http_post(
    url := functions_url || '/' || function_name,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || service_role_key
    ),
    body := payload
  );
end;
$$;

-- Messages trigger: fan each new row to the push-on-message Edge Function.
create or replace function public.notify_message_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_push(
    'push-on-message',
    jsonb_build_object(
      'type', 'INSERT',
      'table', 'messages',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_message_created_push on public.messages;
create trigger on_message_created_push
  after insert on public.messages
  for each row
  execute function public.notify_message_push();
