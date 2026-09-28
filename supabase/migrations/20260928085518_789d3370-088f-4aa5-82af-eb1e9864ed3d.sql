
create or replace function public.is_couple_member(_user uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.couple_members where user_id = _user and couple_id = public.my_couple_id())
$$;
revoke execute on function public.is_couple_member(uuid) from public, anon;
grant execute on function public.is_couple_member(uuid) to authenticated;
create policy "partner avatar read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] like 'u-%'
    and (storage.foldername(name))[2] = 'avatar'
    and public.is_couple_member(substr((storage.foldername(name))[1], 3)::uuid));
