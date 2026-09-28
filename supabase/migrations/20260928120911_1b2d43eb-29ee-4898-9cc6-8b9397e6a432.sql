create or replace function public.capsule_file_readable(_name text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.capsules c where (c.photo_path = _name or c.voice_path = _name) and public.capsule_readable(c.id)) $$;
revoke execute on function public.capsule_file_readable(text) from public, anon;
grant execute on function public.capsule_file_readable(text) to authenticated;
drop policy if exists "capsule files recipient read" on storage.objects;
create policy "capsule files recipient read" on storage.objects for select to authenticated using (
  bucket_id = 'photos' and (storage.foldername(name))[2] = 'capsules' and public.capsule_file_readable(name));