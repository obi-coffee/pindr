-- Apple App Store Guideline 5.1.1(v): apps that allow account creation
-- must also let users delete their account from inside the app. This
-- function deletes the caller's auth.users row; the existing
-- on-delete-cascade chain on every user-owned table (profiles, swipes,
-- matches, messages, blocks, reports, rounds, push_tokens, etc.)
-- removes their data without manual fan-out.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'unauthenticated';
  end if;

  delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
