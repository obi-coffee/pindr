-- Photos bucket: public-read so the URL stored in profiles.photo_urls
-- works without signing. Write access is restricted to a user's own
-- {user_id}/... folder. Profile-level visibility is enforced by the
-- RLS on public.profiles.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Anyone can view photos"
  on storage.objects
  for select
  using (bucket_id = 'photos');

create policy "Users can upload to their own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
