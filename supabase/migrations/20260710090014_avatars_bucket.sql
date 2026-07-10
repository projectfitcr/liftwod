-- Profile photos: public-read avatars bucket; each user may write only
-- their own object ({uid}.jpg). URLs land on profiles.avatar_url and are
-- exposed to members via the member_directory view (names+faces only).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg'])
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg'];

create policy avatars_select on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars');

create policy avatars_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

create policy avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

create policy avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');
