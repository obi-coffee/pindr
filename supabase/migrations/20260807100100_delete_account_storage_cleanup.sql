-- Security/privacy fix: delete_my_account removed every database row via
-- the on-delete-cascade chain, but the user's photos stayed behind in the
-- public 'photos' storage bucket — so old profile-photo URLs kept working
-- after the account was gone.
--
-- Now the caller's photo objects are deleted first. Removing the
-- storage.objects row is what makes the public URL stop resolving; the
-- underlying file becomes unreachable immediately.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'unauthenticated';
  end if;

  -- Photos live under a folder named after the user's id
  -- (enforced by the storage RLS policies in 20260418220000).
  delete from storage.objects
  where bucket_id = 'photos'
    and (storage.foldername(name))[1] = uid::text;

  delete from auth.users where id = uid;
end;
$$;
