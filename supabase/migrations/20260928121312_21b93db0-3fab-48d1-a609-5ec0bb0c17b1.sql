drop function public.use_coach(); drop function public.coach_remaining();
create or replace function public.coach_premium(_user uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.subscriptions s join public.couple_members m on m.couple_id = s.couple_id where m.user_id = _user and s.plan <> 'free' and s.status = 'active') $$;
create or replace function public.use_coach(_user uuid, _consume boolean) returns int language plpgsql security definer set search_path = public as $$
declare wk date := date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh')::date; lim int; n int;
begin
  if public.coach_premium(_user) then return -1; end if;
  select coalesce((select (value #>> '{}')::int from public.app_settings where key = 'coach_free_weekly'), 3) into lim;
  insert into public.coach_usage (user_id, week_start) values (_user, wk) on conflict do nothing;
  select used into n from public.coach_usage where user_id = _user and week_start = wk for update;
  if not _consume then return greatest(0, lim - n); end if;
  if n >= lim then raise exception 'coach limit'; end if;
  update public.coach_usage set used = n + 1, updated_at = now() where user_id = _user and week_start = wk;
  return lim - n - 1;
end $$;
revoke execute on function public.coach_premium(uuid), public.use_coach(uuid, boolean) from public, anon, authenticated;
grant execute on function public.coach_premium(uuid), public.use_coach(uuid, boolean) to service_role;