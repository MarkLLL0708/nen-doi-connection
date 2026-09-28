alter table public.profiles add column if not exists save_coach_history boolean not null default false;

create table public.coach_usage (
  user_id uuid not null, week_start date not null, used int not null default 0,
  updated_at timestamptz not null default now(), primary key (user_id, week_start)
);
grant select on public.coach_usage to authenticated;
grant all on public.coach_usage to service_role;
alter table public.coach_usage enable row level security;
create policy "own coach usage" on public.coach_usage for select to authenticated using (user_id = auth.uid());

create table public.coach_history (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
  use_case text not null, tone text not null, dialect text not null, input text not null, output jsonb not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.coach_history to authenticated;
grant all on public.coach_history to service_role;
alter table public.coach_history enable row level security;
create policy "own coach history read" on public.coach_history for select to authenticated using (user_id = auth.uid());
create policy "own coach history write" on public.coach_history for insert to authenticated with check (user_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.save_coach_history));
create policy "own coach history delete" on public.coach_history for delete to authenticated using (user_id = auth.uid());

insert into public.app_settings (key, value) values ('coach_free_weekly', '3'::jsonb) on conflict (key) do nothing;

-- Checks and consumes one weekly suggestion; returns remaining (-1 = unlimited). Raises 'coach limit' when used up.
create or replace function public.use_coach() returns int language plpgsql security definer set search_path = public as $$
declare wk date := date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh')::date; lim int; n int; premium boolean;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select exists (select 1 from public.subscriptions s where s.couple_id = public.my_couple_id() and s.plan <> 'free' and s.status = 'active') into premium;
  if premium then return -1; end if;
  select coalesce((select (value #>> '{}')::int from public.app_settings where key = 'coach_free_weekly'), 3) into lim;
  insert into public.coach_usage (user_id, week_start) values (auth.uid(), wk) on conflict do nothing;
  select used into n from public.coach_usage where user_id = auth.uid() and week_start = wk for update;
  if n >= lim then raise exception 'coach limit'; end if;
  update public.coach_usage set used = n + 1, updated_at = now() where user_id = auth.uid() and week_start = wk;
  return lim - n - 1;
end $$;

create or replace function public.coach_remaining() returns int language plpgsql stable security definer set search_path = public as $$
declare wk date := date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh')::date; lim int;
begin
  if exists (select 1 from public.subscriptions s where s.couple_id = public.my_couple_id() and s.plan <> 'free' and s.status = 'active') then return -1; end if;
  select coalesce((select (value #>> '{}')::int from public.app_settings where key = 'coach_free_weekly'), 3) into lim;
  return greatest(0, lim - coalesce((select used from public.coach_usage where user_id = auth.uid() and week_start = wk), 0));
end $$;
revoke execute on function public.use_coach(), public.coach_remaining() from public, anon;
grant execute on function public.use_coach(), public.coach_remaining() to authenticated;