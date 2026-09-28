create or replace function public.swipe_date(_idea uuid, _liked boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare c uuid := public.my_couple_id(); matched boolean := false;
begin
  if c is null then raise exception 'no couple'; end if;
  insert into public.date_swipes(couple_id, user_id, idea_id, liked) values (c, auth.uid(), _idea, _liked)
    on conflict (user_id, idea_id) do update set liked = excluded.liked;
  if _liked then
    select exists(select 1 from public.date_swipes where couple_id = c and idea_id = _idea and user_id <> auth.uid() and liked) into matched;
    if matched then insert into public.shared_date_list(couple_id, idea_id) values (c, _idea) on conflict do nothing; end if;
  end if;
  return matched;
end $$;
revoke execute on function public.swipe_date(uuid, boolean) from public, anon;
grant execute on function public.swipe_date(uuid, boolean) to authenticated;

create policy "memory photos read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text and (storage.foldername(name))[2] = 'memories');