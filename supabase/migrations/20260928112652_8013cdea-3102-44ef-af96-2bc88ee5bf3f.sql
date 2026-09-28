create table public.app_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
grant select on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "signed in read settings" on public.app_settings for select to authenticated using (true);
create policy "admin manage settings" on public.app_settings for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  type text not null,
  played_on date not null,
  answerer uuid,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
grant select on public.game_rounds to authenticated;
grant all on public.game_rounds to service_role;
alter table public.game_rounds enable row level security;
create policy "couple reads rounds" on public.game_rounds for select to authenticated using (couple_id = public.my_couple_id());

alter table public.game_sessions add column round_id uuid references public.game_rounds(id) on delete cascade;
alter table public.game_sessions drop constraint game_sessions_couple_id_content_id_played_on_key;
create unique index game_sessions_round_content on public.game_sessions(round_id, content_id) where round_id is not null;
drop policy "create couple sessions" on public.game_sessions;

create or replace function public.round_completed(_round uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select (select count(*) from (
    select r.user_id from public.game_responses r join public.game_sessions s on s.id = r.session_id
    where s.round_id = _round group by r.user_id
    having count(*) >= (select count(*) from public.game_sessions where round_id = _round)
  ) x) >= 2
$$;

create or replace function public.can_see_response(_session uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare rid uuid;
begin
  select round_id into rid from public.game_sessions where id = _session;
  if rid is null then return public.has_responded(_session); end if;
  return public.round_completed(rid);
end $$;

drop policy "own or revealed responses" on public.game_responses;
create policy "own or revealed responses" on public.game_responses for select to authenticated
  using (user_id = auth.uid() or (couple_id = public.my_couple_id() and public.can_see_response(session_id)));

create or replace function public.lock_round_responses() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then return coalesce(new, old); end if;
  if exists (select 1 from public.game_sessions where id = old.session_id and round_id is not null) then
    raise exception 'round answers are final';
  end if;
  return coalesce(new, old);
end $$;
create trigger lock_round_responses before update or delete on public.game_responses for each row execute function public.lock_round_responses();

create or replace function public.round_status(_round uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare cid uuid := public.my_couple_id(); rr public.game_rounds%rowtype; total int;
begin
  select * into rr from public.game_rounds where id = _round and couple_id = cid;
  if not found then return null; end if;
  select count(*) into total from public.game_sessions where round_id = _round;
  return jsonb_build_object('id', rr.id, 'type', rr.type, 'played_on', rr.played_on, 'answerer', rr.answerer, 'total', total,
    'completed', public.round_completed(_round),
    'members', (select coalesce(jsonb_agg(jsonb_build_object('user_id', cm.user_id, 'done',
      (select count(*) from public.game_responses r join public.game_sessions s on s.id = r.session_id where s.round_id = _round and r.user_id = cm.user_id))), '[]'::jsonb)
      from public.couple_members cm where cm.couple_id = cid));
end $$;

create or replace function public.start_round(_type text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid := public.my_couple_id(); tz text; d date; r uuid; lim int; sz int; used int; ans uuid; prev uuid;
begin
  if cid is null then raise exception 'no couple'; end if;
  if _type not in ('this_or_that','who_more_likely','guess','rapid_qa') then raise exception 'bad type'; end if;
  perform pg_advisory_xact_lock(hashtext(cid::text));
  select timezone into tz from public.couples where id = cid;
  d := (now() at time zone coalesce(tz,'Asia/Ho_Chi_Minh'))::date;
  select g.id into r from public.game_rounds g where g.couple_id = cid and g.type = _type and g.played_on = d and not public.round_completed(g.id) order by g.created_at desc limit 1;
  if r is not null then return r; end if;
  lim := coalesce((select (value #>> '{}')::int from public.app_settings where key = 'daily_game_limit'), 2);
  sz := coalesce((select (value #>> '{}')::int from public.app_settings where key = 'round_size'), 8);
  select count(*) into used from public.game_rounds g where g.couple_id = cid and g.played_on = d;
  if used >= lim then raise exception 'daily limit'; end if;
  if _type = 'guess' then
    select g.answerer into prev from public.game_rounds g where g.couple_id = cid and g.type = 'guess' order by g.created_at desc limit 1;
    if prev is null then ans := auth.uid();
    else select cm.user_id into ans from public.couple_members cm where cm.couple_id = cid and cm.user_id <> prev limit 1; ans := coalesce(ans, auth.uid()); end if;
  end if;
  insert into public.game_rounds (couple_id, type, played_on, answerer, created_by) values (cid, _type, d, ans, auth.uid()) returning id into r;
  insert into public.game_sessions (couple_id, content_id, played_on, round_id)
    select cid, gc.id, d, r from public.game_content gc where gc.type = _type
    order by (select count(*) from public.game_sessions s where s.couple_id = cid and s.content_id = gc.id), random() limit sz;
  return r;
end $$;

revoke execute on function public.round_completed(uuid), public.can_see_response(uuid), public.round_status(uuid), public.start_round(text), public.lock_round_responses() from anon, public;
grant execute on function public.round_completed(uuid), public.can_see_response(uuid), public.round_status(uuid), public.start_round(text) to authenticated;

create or replace function public.today_question()
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare cid uuid := public.my_couple_id(); tz text; d date; qid uuid; sens boolean; q public.daily_questions%rowtype; mine boolean; theirs boolean;
begin
  if cid is null then return null; end if;
  select timezone into tz from public.couples where id = cid;
  d := (now() at time zone coalesce(tz,'Asia/Ho_Chi_Minh'))::date;
  sens := (select count(*) from public.pack_consents where couple_id = cid and agreed) >= 2;
  select question_id into qid from public.couple_questions where couple_id = cid and day = d;
  if qid is not null and not sens
     and exists (select 1 from public.daily_questions where id = qid and pack in ('family','money'))
     and not exists (select 1 from public.question_answers where couple_id = cid and answer_date = d) then
    delete from public.couple_questions where couple_id = cid and day = d;
    qid := null;
  end if;
  if qid is null then
    select dq.id into qid from public.daily_questions dq
      where sens or dq.pack not in ('family','money')
      order by (select count(*) from public.couple_questions cq where cq.couple_id = cid and cq.question_id = dq.id), random() limit 1;
    if qid is null then return null; end if;
    insert into public.couple_questions (couple_id, day, question_id) values (cid, d, qid) on conflict do nothing;
    select question_id into qid from public.couple_questions where couple_id = cid and day = d;
  end if;
  select * into q from public.daily_questions where id = qid;
  select agreed into mine from public.pack_consents where couple_id = cid and user_id = auth.uid();
  select agreed into theirs from public.pack_consents where couple_id = cid and user_id <> auth.uid();
  return jsonb_build_object('date', d, 'id', q.id, 'pack', q.pack, 'text_vi', q.text_vi, 'text_vi_north', q.text_vi_north, 'text_vi_south', q.text_vi_south,
    'sensitive_on', sens, 'consent_mine', mine, 'consent_partner', theirs,
    'partner_answered', exists (select 1 from public.question_answers a where a.couple_id = cid and a.question_id = q.id and a.answer_date = d and a.user_id <> auth.uid()));
end $function$;