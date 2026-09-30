ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'couple' CHECK (kind IN ('couple','friends'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_term text, ADD COLUMN IF NOT EXISTS content_style text;
ALTER TABLE public.daily_questions ADD COLUMN IF NOT EXISTS audience text[] NOT NULL DEFAULT '{couple}';
ALTER TABLE public.game_content ADD COLUMN IF NOT EXISTS audience text[] NOT NULL DEFAULT '{couple}';
ALTER TABLE public.date_ideas ADD COLUMN IF NOT EXISTS audience text[] NOT NULL DEFAULT '{couple}';
ALTER TABLE public.occasion_catalog ADD COLUMN IF NOT EXISTS audience text[] NOT NULL DEFAULT '{couple}';

CREATE OR REPLACE FUNCTION public.lock_couple_kind() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.kind IS DISTINCT FROM OLD.kind THEN RAISE EXCEPTION 'kind cannot change'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS couples_lock_kind ON public.couples;
CREATE TRIGGER couples_lock_kind BEFORE UPDATE ON public.couples FOR EACH ROW EXECUTE FUNCTION public.lock_couple_kind();

CREATE OR REPLACE FUNCTION public.my_space_kind() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.kind FROM public.couples c WHERE c.id = public.my_couple_id()
$$;

-- Restrictive policies only narrow what can be read.
CREATE POLICY "Audience matches space" ON public.daily_questions AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.my_space_kind() IS NULL OR public.my_space_kind() = ANY(audience));
CREATE POLICY "Audience matches space" ON public.game_content AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.my_space_kind() IS NULL OR public.my_space_kind() = ANY(audience));
CREATE POLICY "Audience matches space" ON public.date_ideas AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.my_space_kind() IS NULL OR public.my_space_kind() = ANY(audience));
CREATE POLICY "Audience matches space" ON public.occasion_catalog AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.my_space_kind() IS NULL OR public.my_space_kind() = ANY(audience));

CREATE OR REPLACE FUNCTION public.create_space(_kind text, _start_date date, _type text, _my_city text, _partner_city text)
 RETURNS TABLE(couple_id uuid, code text) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare cid uuid; tz text; c text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if _kind not in ('couple','friends') then raise exception 'bad kind'; end if;
  if exists (select 1 from public.couple_members m where m.user_id = auth.uid()) then raise exception 'already in a couple'; end if;
  select p.timezone into tz from public.profiles p where p.id = auth.uid();
  insert into public.couples (kind, start_date, relationship_type, partner_city, timezone, created_by)
    values (_kind, _start_date, _type, _partner_city, coalesce(tz,'Asia/Ho_Chi_Minh'), auth.uid()) returning id into cid;
  insert into public.couple_members (couple_id, user_id, city) values (cid, auth.uid(), _my_city);
  insert into public.streaks (couple_id) values (cid);
  insert into public.subscriptions (couple_id) values (cid);
  c := public.gen_invite_code();
  insert into public.invites (code, couple_id, created_by) values (c, cid, auth.uid());
  couple_id := cid; code := c; return next;
end $function$;
REVOKE EXECUTE ON FUNCTION public.create_space(text,date,text,text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_space(text,date,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_round(_type text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare cid uuid := public.my_couple_id(); tz text; d date; r uuid; lim int; sz int; used int; ans uuid; prev uuid; k text;
begin
  if cid is null then raise exception 'no couple'; end if;
  if _type not in ('this_or_that','who_more_likely','guess','rapid_qa') then raise exception 'bad type'; end if;
  perform pg_advisory_xact_lock(hashtext(cid::text));
  select timezone, kind into tz, k from public.couples where id = cid;
  if not exists (select 1 from public.game_content gc where gc.type = _type and k = any(gc.audience)) then raise exception 'no content'; end if;
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
    select cid, gc.id, d, r from public.game_content gc where gc.type = _type and k = any(gc.audience)
    order by (select count(*) from public.game_sessions s where s.couple_id = cid and s.content_id = gc.id), random() limit sz;
  return r;
end $function$;

CREATE OR REPLACE FUNCTION public.today_question()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare cid uuid := public.my_couple_id(); tz text; d date; qid uuid; sens boolean; q public.daily_questions%rowtype; mine boolean; theirs boolean; k text;
begin
  if cid is null then return null; end if;
  select timezone, kind into tz, k from public.couples where id = cid;
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
      where (sens or dq.pack not in ('family','money')) and k = any(dq.audience)
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