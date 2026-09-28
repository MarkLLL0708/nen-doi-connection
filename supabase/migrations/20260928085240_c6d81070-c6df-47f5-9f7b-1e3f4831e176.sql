
create table public.profiles (
  id uuid primary key,
  display_name text,
  birthday date,
  avatar text,
  partner_call_name text,
  dialect text check (dialect in ('bac','trung','nam','neutral')),
  tone text check (tone in ('sweet','genz','neutral')),
  timezone text not null default 'Asia/Ho_Chi_Minh',
  language text not null default 'vi',
  theme text not null default 'system' check (theme in ('light','dark','system')),
  age_confirmed boolean not null default false,
  consent_at timestamptz,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  start_date date,
  relationship_type text check (relationship_type in ('dating','engaged','married','long_distance')),
  partner_city text,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  status text not null default 'active' check (status in ('active','ended')),
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create table public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null unique,
  city text,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);
grant select, update on public.couples to authenticated;
grant select, update on public.couple_members to authenticated;
grant all on public.couples, public.couple_members to service_role;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;

create or replace function public.my_couple_id() returns uuid language sql stable security definer set search_path = public as $$
  select cm.couple_id from public.couple_members cm join public.couples c on c.id = cm.couple_id
  where cm.user_id = auth.uid() and c.status = 'active' limit 1
$$;
create or replace function public.couple_size(_couple uuid) returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.couple_members where couple_id = _couple
$$;

create policy "own profile or partner profile" on public.profiles for select to authenticated
  using (id = auth.uid() or id in (select user_id from public.couple_members where couple_id = public.my_couple_id()));
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "read own couple" on public.couples for select to authenticated using (id = public.my_couple_id());
create policy "update own couple" on public.couples for update to authenticated using (id = public.my_couple_id()) with check (id = public.my_couple_id());
create policy "read own couple members" on public.couple_members for select to authenticated using (couple_id = public.my_couple_id());
create policy "update own member row" on public.couple_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());

create table public.invites (
  code text primary key,
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null,
  expires_at timestamptz not null default now() + interval '7 days',
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.invites to authenticated;
grant all on public.invites to service_role;
alter table public.invites enable row level security;
create policy "read own couple invites" on public.invites for select to authenticated using (couple_id = public.my_couple_id());

create table public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  pack text not null check (pack in ('memory','food','tet','distance','deep','fun')),
  sensitivity text not null default 'normal' check (sensitivity in ('normal','high')),
  text_vi text not null,
  text_vi_north text, text_vi_south text, text_vi_sweet text, text_vi_genz text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.photo_prompts (
  id uuid primary key default gen_random_uuid(),
  text_vi text not null,
  sort_order int not null default 0
);
create table public.game_content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('who_more_likely','this_or_that','rapid_qa','guess')),
  pack text,
  content jsonb not null,
  sort_order int not null default 0
);
create table public.date_ideas (
  id uuid primary key default gen_random_uuid(),
  title_vi text not null,
  city text,
  budget text check (budget in ('free','low','mid','high')),
  mood text,
  created_at timestamptz not null default now()
);
grant select on public.daily_questions, public.photo_prompts, public.game_content, public.date_ideas to authenticated;
grant all on public.daily_questions, public.photo_prompts, public.game_content, public.date_ideas to service_role;
alter table public.daily_questions enable row level security;
alter table public.photo_prompts enable row level security;
alter table public.game_content enable row level security;
alter table public.date_ideas enable row level security;
create policy "signed in read" on public.daily_questions for select to authenticated using (true);
create policy "signed in read" on public.photo_prompts for select to authenticated using (true);
create policy "signed in read" on public.game_content for select to authenticated using (true);
create policy "signed in read" on public.date_ideas for select to authenticated using (true);

create table public.question_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  question_id uuid not null references public.daily_questions(id),
  user_id uuid not null default auth.uid(),
  answer_date date not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (user_id, question_id, answer_date)
);
create table public.photo_posts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  prompt_id uuid references public.photo_prompts(id),
  user_id uuid not null default auth.uid(),
  post_date date not null,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now(),
  unique (user_id, post_date)
);
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  content_id uuid not null references public.game_content(id),
  played_on date not null,
  created_at timestamptz not null default now(),
  unique (couple_id, content_id, played_on)
);
create table public.game_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  response jsonb not null,
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);
grant select, insert, update, delete on public.question_answers, public.photo_posts, public.game_responses to authenticated;
grant select, insert on public.game_sessions to authenticated;
grant all on public.question_answers, public.photo_posts, public.game_sessions, public.game_responses to service_role;
alter table public.question_answers enable row level security;
alter table public.photo_posts enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_responses enable row level security;

create or replace function public.has_answered(_question uuid, _date date) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.question_answers where user_id = auth.uid() and question_id = _question and answer_date = _date)
$$;
create or replace function public.has_posted(_date date) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.photo_posts where user_id = auth.uid() and post_date = _date)
$$;
create or replace function public.has_responded(_session uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.game_responses where user_id = auth.uid() and session_id = _session)
$$;

create policy "own or revealed answers" on public.question_answers for select to authenticated
  using (user_id = auth.uid() or (couple_id = public.my_couple_id() and public.has_answered(question_id, answer_date)));
create policy "insert own answer" on public.question_answers for insert to authenticated
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "update own answer" on public.question_answers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "delete own answer" on public.question_answers for delete to authenticated using (user_id = auth.uid());

create policy "own or revealed photos" on public.photo_posts for select to authenticated
  using (user_id = auth.uid() or (couple_id = public.my_couple_id() and public.has_posted(post_date)));
create policy "insert own photo" on public.photo_posts for insert to authenticated
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "update own photo" on public.photo_posts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "delete own photo" on public.photo_posts for delete to authenticated using (user_id = auth.uid());

create policy "couple sessions" on public.game_sessions for select to authenticated using (couple_id = public.my_couple_id());
create policy "create couple sessions" on public.game_sessions for insert to authenticated with check (couple_id = public.my_couple_id());

create policy "own or revealed responses" on public.game_responses for select to authenticated
  using (user_id = auth.uid() or (couple_id = public.my_couple_id() and public.has_responded(session_id)));
create policy "insert own response" on public.game_responses for insert to authenticated
  with check (user_id = auth.uid() and couple_id = public.my_couple_id()
    and exists (select 1 from public.game_sessions s where s.id = session_id and s.couple_id = public.my_couple_id()));
create policy "update own response" on public.game_responses for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "delete own response" on public.game_responses for delete to authenticated using (user_id = auth.uid());

create table public.streaks (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  current int not null default 0,
  best int not null default 0,
  last_completed date,
  updated_at timestamptz not null default now()
);
create table public.streak_freezes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  month date not null,
  covered_date date not null,
  created_at timestamptz not null default now(),
  unique (couple_id, month)
);
grant select on public.streaks, public.streak_freezes to authenticated;
grant all on public.streaks, public.streak_freezes to service_role;
alter table public.streaks enable row level security;
alter table public.streak_freezes enable row level security;
create policy "read own streak" on public.streaks for select to authenticated using (couple_id = public.my_couple_id());
create policy "read own freezes" on public.streak_freezes for select to authenticated using (couple_id = public.my_couple_id());

create table public.date_swipes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  idea_id uuid not null references public.date_ideas(id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, idea_id)
);
create table public.shared_date_list (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  idea_id uuid not null references public.date_ideas(id) on delete cascade,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (couple_id, idea_id)
);
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null default auth.uid(),
  title text not null,
  happened_on date,
  note text,
  storage_path text,
  created_at timestamptz not null default now()
);
create table public.occasions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  kind text not null,
  title text not null,
  occurs_on date not null,
  created_at timestamptz not null default now()
);
create table public.subscriptions (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  renews_at timestamptz,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.date_swipes, public.shared_date_list, public.memories, public.occasions to authenticated;
grant select on public.subscriptions to authenticated;
grant all on public.date_swipes, public.shared_date_list, public.memories, public.occasions, public.subscriptions to service_role;
alter table public.date_swipes enable row level security;
alter table public.shared_date_list enable row level security;
alter table public.memories enable row level security;
alter table public.occasions enable row level security;
alter table public.subscriptions enable row level security;
create policy "own swipes" on public.date_swipes for select to authenticated using (user_id = auth.uid());
create policy "insert own swipes" on public.date_swipes for insert to authenticated with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "update own swipes" on public.date_swipes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple_id());
create policy "delete own swipes" on public.date_swipes for delete to authenticated using (user_id = auth.uid());
create policy "couple list" on public.shared_date_list for all to authenticated using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "couple memories" on public.memories for all to authenticated using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "couple occasions" on public.occasions for all to authenticated using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "read own subscription" on public.subscriptions for select to authenticated using (couple_id = public.my_couple_id());

create or replace function public.gen_invite_code() returns text language plpgsql volatile set search_path = public as $$
declare chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := '';
    for i in 1..6 loop c := c || substr(chars, 1 + floor(random() * length(chars))::int, 1); end loop;
    exit when not exists (select 1 from public.invites where code = c);
  end loop;
  return c;
end $$;

create or replace function public.create_couple(_start_date date, _type text, _my_city text, _partner_city text)
returns table (couple_id uuid, code text) language plpgsql security definer set search_path = public as $$
declare cid uuid; tz text; c text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from public.couple_members m where m.user_id = auth.uid()) then raise exception 'already in a couple'; end if;
  select p.timezone into tz from public.profiles p where p.id = auth.uid();
  insert into public.couples (start_date, relationship_type, partner_city, timezone, created_by)
    values (_start_date, _type, _partner_city, coalesce(tz,'Asia/Ho_Chi_Minh'), auth.uid()) returning id into cid;
  insert into public.couple_members (couple_id, user_id, city) values (cid, auth.uid(), _my_city);
  insert into public.streaks (couple_id) values (cid);
  insert into public.subscriptions (couple_id) values (cid);
  c := public.gen_invite_code();
  insert into public.invites (code, couple_id, created_by) values (c, cid, auth.uid());
  couple_id := cid; code := c; return next;
end $$;

create or replace function public.refresh_invite() returns text language plpgsql security definer set search_path = public as $$
declare cid uuid := public.my_couple_id(); c text;
begin
  if cid is null then raise exception 'no couple'; end if;
  if public.couple_size(cid) >= 2 then raise exception 'already paired'; end if;
  select i.code into c from public.invites i where i.couple_id = cid and i.used_by is null and i.expires_at > now() order by i.created_at desc limit 1;
  if c is null then
    c := public.gen_invite_code();
    insert into public.invites (code, couple_id, created_by) values (c, cid, auth.uid());
  end if;
  return c;
end $$;

create or replace function public.join_couple(_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare inv public.invites%rowtype; pc text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then raise exception 'already in a couple'; end if;
  select * into inv from public.invites where code = upper(trim(_code)) for update;
  if not found or inv.used_by is not null or inv.expires_at < now() then raise exception 'invalid code'; end if;
  if public.couple_size(inv.couple_id) >= 2 then raise exception 'couple full'; end if;
  select partner_city into pc from public.couples where id = inv.couple_id;
  insert into public.couple_members (couple_id, user_id, city) values (inv.couple_id, auth.uid(), pc);
  update public.invites set used_by = auth.uid(), used_at = now() where code = inv.code;
  return inv.couple_id;
end $$;

create or replace function public.bump_streak(_couple uuid, _day date) returns void language plpgsql security definer set search_path = public as $$
declare s public.streaks%rowtype; both_done boolean; m date;
begin
  select (count(distinct u) >= 2) into both_done from (
    select user_id u from public.question_answers where couple_id = _couple and answer_date = _day
    union select user_id from public.photo_posts where couple_id = _couple and post_date = _day
    union select r.user_id from public.game_responses r join public.game_sessions g on g.id = r.session_id where r.couple_id = _couple and g.played_on = _day
  ) x;
  if not both_done then return; end if;
  select * into s from public.streaks where couple_id = _couple for update;
  if not found then insert into public.streaks (couple_id) values (_couple) returning * into s; end if;
  if s.last_completed = _day then return; end if;
  if s.last_completed = _day - 1 then
    s.current := s.current + 1;
  elsif s.last_completed = _day - 2 then
    m := date_trunc('month', _day - 1)::date;
    if not exists (select 1 from public.streak_freezes where couple_id = _couple and month = m) then
      insert into public.streak_freezes (couple_id, month, covered_date) values (_couple, m, _day - 1);
      s.current := s.current + 1;
    else s.current := 1; end if;
  else s.current := 1; end if;
  update public.streaks set current = s.current, best = greatest(best, s.current), last_completed = _day, updated_at = now() where couple_id = _couple;
end $$;

create or replace function public.trg_answer_streak() returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.bump_streak(new.couple_id, new.answer_date); return new; end $$;
create or replace function public.trg_photo_streak() returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.bump_streak(new.couple_id, new.post_date); return new; end $$;
create or replace function public.trg_game_streak() returns trigger language plpgsql security definer set search_path = public as $$
declare d date; begin select played_on into d from public.game_sessions where id = new.session_id; perform public.bump_streak(new.couple_id, d); return new; end $$;
create trigger answer_streak after insert on public.question_answers for each row execute function public.trg_answer_streak();
create trigger photo_streak after insert on public.photo_posts for each row execute function public.trg_photo_streak();
create trigger game_streak after insert on public.game_responses for each row execute function public.trg_game_streak();

create or replace function public.today_status() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare cid uuid := public.my_couple_id(); tz text; d date; res jsonb;
begin
  if cid is null then return null; end if;
  select timezone into tz from public.couples where id = cid;
  d := (now() at time zone coalesce(tz,'Asia/Ho_Chi_Minh'))::date;
  select jsonb_build_object(
    'date', d,
    'local_hour', extract(hour from now() at time zone coalesce(tz,'Asia/Ho_Chi_Minh'))::int,
    'members', coalesce(jsonb_agg(jsonb_build_object(
      'user_id', cm.user_id,
      'question', exists (select 1 from public.question_answers a where a.user_id = cm.user_id and a.answer_date = d),
      'photo', exists (select 1 from public.photo_posts p where p.user_id = cm.user_id and p.post_date = d),
      'game', exists (select 1 from public.game_responses r join public.game_sessions g on g.id = r.session_id where r.user_id = cm.user_id and g.played_on = d)
    )), '[]'::jsonb)
  ) into res from public.couple_members cm where cm.couple_id = cid;
  return res;
end $$;

revoke execute on function public.bump_streak(uuid, date) from public, anon, authenticated;
revoke execute on function public.gen_invite_code() from public, anon, authenticated;
revoke execute on function public.create_couple(date, text, text, text), public.join_couple(text), public.refresh_invite(), public.today_status() from public, anon;
grant execute on function public.create_couple(date, text, text, text), public.join_couple(text), public.refresh_invite(), public.today_status() to authenticated;

create policy "photos read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (
    (storage.foldername(name))[1] = 'u-' || auth.uid()::text
    or ((storage.foldername(name))[1] = public.my_couple_id()::text and (
      owner = auth.uid()
      or (storage.foldername(name))[2] = 'avatars'
      or exists (select 1 from public.photo_posts p where p.storage_path = name and public.has_posted(p.post_date))))));
create policy "photos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] in (public.my_couple_id()::text, 'u-' || auth.uid()::text));
create policy "photos delete own" on storage.objects for delete to authenticated using (bucket_id = 'photos' and owner = auth.uid());
