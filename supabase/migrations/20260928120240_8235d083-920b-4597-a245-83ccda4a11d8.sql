alter table public.memories add column if not exists kind text not null default 'photo', add column if not exists voice_seconds int;
update public.memories set kind = case when storage_path is null then 'note' else 'photo' end where kind = 'photo' and storage_path is null;
alter table public.memories add constraint memories_kind_chk check (kind in ('photo','note','voice'));

create table public.capsules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null,
  recipient_id uuid not null,
  type text not null check (type in ('miss','sad','birthday','anniversary','fight')),
  body text not null default '' check (char_length(body) <= 1000),
  photo_path text,
  voice_path text,
  voice_seconds int check (voice_seconds is null or voice_seconds between 0 and 60),
  unlock_on date,
  status text not null default 'draft' check (status in ('draft','sealed','opened')),
  sealed_at timestamptz, opened_at timestamptz, notified_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.capsules to authenticated;
grant all on public.capsules to service_role;
alter table public.capsules enable row level security;
create policy "sender reads own drafts" on public.capsules for select to authenticated using (sender_id = auth.uid() and status = 'draft');
create policy "sender creates drafts" on public.capsules for insert to authenticated with check (
  sender_id = auth.uid() and status = 'draft' and couple_id = public.my_couple_id()
  and recipient_id <> auth.uid() and public.is_couple_member(recipient_id));
create policy "sender edits drafts" on public.capsules for update to authenticated using (sender_id = auth.uid() and status = 'draft')
  with check (sender_id = auth.uid() and status = 'draft' and couple_id = public.my_couple_id() and recipient_id <> auth.uid() and public.is_couple_member(recipient_id));
create policy "sender deletes drafts" on public.capsules for delete to authenticated using (sender_id = auth.uid() and status = 'draft');
create or replace function public.update_updated_at_column() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end $$;
create trigger capsules_updated before update on public.capsules for each row execute function public.update_updated_at_column();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own notifications mark read" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into public.app_settings (key, value) values ('free_active_capsules', '1'::jsonb) on conflict (key) do nothing;

create or replace function public.capsule_local_today(_couple uuid) returns date language sql stable security definer set search_path = public as $$
  select (now() at time zone coalesce((select timezone from public.couples where id = _couple), 'Asia/Ho_Chi_Minh'))::date $$;

-- Readable by the recipient only once opened, or once the date arrives for date capsules.
create or replace function public.capsule_readable(_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.capsules c where c.id = _id and c.recipient_id = auth.uid() and c.status <> 'draft'
    and (c.status = 'opened' or (c.type in ('birthday','anniversary') and c.unlock_on is not null and c.unlock_on <= public.capsule_local_today(c.couple_id)))) $$;

create or replace function public.list_capsules() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare cid uuid := public.my_couple_id();
begin
  if cid is null then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(x order by x->>'created_at' desc) from (
    select jsonb_build_object('id', c.id, 'type', c.type, 'status', c.status, 'unlock_on', c.unlock_on, 'mine', c.sender_id = auth.uid(),
      'created_at', c.created_at, 'sealed_at', c.sealed_at, 'opened_at', c.opened_at,
      'readable', r.ok,
      'body', case when r.ok or (c.sender_id = auth.uid() and c.status = 'draft') then c.body end,
      'photo_path', case when r.ok or (c.sender_id = auth.uid() and c.status = 'draft') then c.photo_path end,
      'voice_path', case when r.ok or (c.sender_id = auth.uid() and c.status = 'draft') then c.voice_path end,
      'voice_seconds', case when r.ok or (c.sender_id = auth.uid() and c.status = 'draft') then c.voice_seconds end) x
    from public.capsules c cross join lateral (select public.capsule_readable(c.id) ok) r
    where c.couple_id = cid and (c.sender_id = auth.uid() or (c.recipient_id = auth.uid() and c.status <> 'draft'))) s), '[]'::jsonb);
end $$;

create or replace function public.seal_capsule(_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare c public.capsules%rowtype; lim int; premium boolean; active int;
begin
  select * into c from public.capsules where id = _id and sender_id = auth.uid() for update;
  if not found or c.status <> 'draft' then raise exception 'not a draft'; end if;
  if c.type in ('birthday','anniversary') and (c.unlock_on is null or c.unlock_on <= public.capsule_local_today(c.couple_id)) then raise exception 'pick a future date'; end if;
  if c.type not in ('birthday','anniversary') then c.unlock_on := null; end if;
  if char_length(trim(c.body)) = 0 and c.photo_path is null and c.voice_path is null then raise exception 'empty'; end if;
  select exists (select 1 from public.subscriptions s where s.couple_id = c.couple_id and s.plan <> 'free' and s.status = 'active') into premium;
  if not premium then
    select coalesce((select (value #>> '{}')::int from public.app_settings where key = 'free_active_capsules'), 1) into lim;
    select count(*) into active from public.capsules where sender_id = auth.uid() and status = 'sealed';
    if active >= lim then raise exception 'capsule limit'; end if;
  end if;
  update public.capsules set status = 'sealed', sealed_at = now(), unlock_on = c.unlock_on where id = _id;
  if c.type not in ('birthday','anniversary') then
    insert into public.notifications (user_id, kind, data) values (c.recipient_id, 'capsule_received', jsonb_build_object('capsule_id', c.id, 'type', c.type));
    update public.capsules set notified_at = now() where id = _id;
  end if;
end $$;

create or replace function public.open_capsule(_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare c public.capsules%rowtype;
begin
  select * into c from public.capsules where id = _id and recipient_id = auth.uid() for update;
  if not found or c.status = 'draft' then raise exception 'not found'; end if;
  if c.status = 'opened' then return; end if;
  if c.type in ('birthday','anniversary') and (c.unlock_on is null or c.unlock_on > public.capsule_local_today(c.couple_id)) then raise exception 'still sealed'; end if;
  update public.capsules set status = 'opened', opened_at = now() where id = _id;
end $$;

-- Posts "unlocked" notices for date capsules that reached their day (called when the app loads).
create or replace function public.sync_capsule_notices() returns int language plpgsql security definer set search_path = public as $$
declare n int := 0; r record;
begin
  for r in select id, type from public.capsules where recipient_id = auth.uid() and status = 'sealed' and notified_at is null
    and type in ('birthday','anniversary') and unlock_on <= public.capsule_local_today(couple_id) for update loop
    insert into public.notifications (user_id, kind, data) values (auth.uid(), 'capsule_unlocked', jsonb_build_object('capsule_id', r.id, 'type', r.type));
    update public.capsules set notified_at = now() where id = r.id; n := n + 1;
  end loop;
  return n;
end $$;

revoke execute on function public.capsule_local_today(uuid), public.capsule_readable(uuid), public.list_capsules(), public.seal_capsule(uuid), public.open_capsule(uuid), public.sync_capsule_notices() from public, anon;
grant execute on function public.capsule_readable(uuid), public.list_capsules(), public.seal_capsule(uuid), public.open_capsule(uuid), public.sync_capsule_notices() to authenticated;

-- Capsule files live in the sender's own folder (u-<id>/capsules/...); the recipient may read them only when readable.
create policy "capsule files recipient read" on storage.objects for select to authenticated using (
  bucket_id = 'photos' and (storage.foldername(name))[2] = 'capsules'
  and exists (select 1 from public.capsules c where (c.photo_path = objects.name or c.voice_path = objects.name) and public.capsule_readable(c.id)));