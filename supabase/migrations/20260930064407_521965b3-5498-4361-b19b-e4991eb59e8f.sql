ALTER TABLE public.couples ADD COLUMN active_pack text;

-- Members may update their couple row, but the active category only changes through respond_category().
CREATE OR REPLACE FUNCTION public.lock_active_pack() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.active_pack IS DISTINCT FROM OLD.active_pack AND coalesce(current_setting('app.category_switch', true), '') <> 'on' THEN
    RAISE EXCEPTION 'active category changes need both partners';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER couples_lock_active_pack BEFORE UPDATE ON public.couples FOR EACH ROW EXECUTE FUNCTION public.lock_active_pack();

CREATE TABLE public.category_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  from_user uuid NOT NULL,
  pack text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE UNIQUE INDEX category_requests_one_pending ON public.category_requests(couple_id) WHERE status = 'pending';
GRANT SELECT ON public.category_requests TO authenticated;
GRANT ALL ON public.category_requests TO service_role;
ALTER TABLE public.category_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read their category requests" ON public.category_requests FOR SELECT TO authenticated USING (couple_id = public.my_couple_id());

-- Which categories this pair can use right now (kind + sensitive-topic consent), with question counts.
CREATE OR REPLACE FUNCTION public.category_state() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid := public.my_couple_id(); k text; ap text; sens boolean; req jsonb; packs jsonb;
BEGIN
  IF cid IS NULL THEN RETURN NULL; END IF;
  SELECT kind, active_pack INTO k, ap FROM couples WHERE id = cid;
  sens := (SELECT count(*) FROM pack_consents WHERE couple_id = cid AND agreed) >= 2;
  SELECT coalesce(jsonb_agg(jsonb_build_object('pack', pack, 'count', n) ORDER BY pack), '[]') INTO packs FROM (
    SELECT dq.pack, count(*) n FROM daily_questions dq
    LEFT JOIN couple_question_passes p ON p.couple_id = cid AND p.question_id = dq.id
    WHERE k = ANY(dq.audience) AND (sens OR dq.pack NOT IN ('family','money')) AND coalesce(p.excluded,false) = false
    GROUP BY dq.pack) x;
  SELECT jsonb_build_object('id', id, 'pack', pack, 'mine', from_user = auth.uid(), 'created_at', created_at) INTO req
    FROM category_requests WHERE couple_id = cid AND status = 'pending';
  RETURN jsonb_build_object('active', ap, 'packs', packs, 'pending', req);
END $$;

CREATE OR REPLACE FUNCTION public.request_category(_pack text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid := public.my_couple_id(); k text; ap text; sens boolean; p uuid; rid uuid; ex record;
BEGIN
  IF cid IS NULL OR public.couple_size(cid) < 2 THEN RAISE EXCEPTION 'not paired'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(cid::text || ':cat'));
  SELECT kind, active_pack INTO k, ap FROM couples WHERE id = cid;
  IF _pack = ap THEN RAISE EXCEPTION 'already active'; END IF;
  sens := (SELECT count(*) FROM pack_consents WHERE couple_id = cid AND agreed) >= 2;
  IF NOT EXISTS (SELECT 1 FROM daily_questions WHERE pack = _pack AND k = ANY(audience) AND (sens OR pack NOT IN ('family','money'))) THEN
    RAISE EXCEPTION 'category unavailable';
  END IF;
  SELECT * INTO ex FROM category_requests WHERE couple_id = cid AND status = 'pending';
  IF FOUND THEN
    IF ex.from_user <> auth.uid() THEN RAISE EXCEPTION 'partner request pending'; END IF;
    UPDATE category_requests SET status = 'cancelled', decided_at = now() WHERE id = ex.id;
  END IF;
  INSERT INTO category_requests(couple_id, from_user, pack) VALUES (cid, auth.uid(), _pack) RETURNING id INTO rid;
  SELECT user_id INTO p FROM couple_members WHERE couple_id = cid AND user_id <> auth.uid() LIMIT 1;
  INSERT INTO notifications(user_id, kind, data) VALUES (p, 'category_request', jsonb_build_object('from', auth.uid(), 'pack', _pack, 'request', rid));
  RETURN rid;
END $$;

CREATE OR REPLACE FUNCTION public.respond_category(_id uuid, _accept boolean) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid := public.my_couple_id(); r category_requests%rowtype;
BEGIN
  IF cid IS NULL THEN RAISE EXCEPTION 'not paired'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(cid::text || ':cat'));
  SELECT * INTO r FROM category_requests WHERE id = _id AND couple_id = cid FOR UPDATE;
  IF NOT FOUND OR r.status <> 'pending' THEN RAISE EXCEPTION 'request not pending'; END IF;
  IF r.from_user = auth.uid() THEN RAISE EXCEPTION 'cannot answer own request'; END IF;
  UPDATE category_requests SET status = CASE WHEN _accept THEN 'accepted' ELSE 'declined' END, decided_at = now() WHERE id = _id;
  IF _accept THEN
    PERFORM set_config('app.category_switch', 'on', true);
    UPDATE couples SET active_pack = r.pack WHERE id = cid;
    PERFORM set_config('app.category_switch', 'off', true);
  END IF;
  INSERT INTO notifications(user_id, kind, data) VALUES (r.from_user, CASE WHEN _accept THEN 'category_accepted' ELSE 'category_declined' END, jsonb_build_object('pack', r.pack));
  RETURN CASE WHEN _accept THEN 'accepted' ELSE 'declined' END;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_category(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid := public.my_couple_id();
BEGIN
  UPDATE category_requests SET status = 'cancelled', decided_at = now()
    WHERE id = _id AND couple_id = cid AND from_user = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'request not pending'; END IF;
END $$;

-- Daily question now comes from the active category (falls back to the full mix only when that category is used up).
CREATE OR REPLACE FUNCTION public.today_question()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare cid uuid := public.my_couple_id(); tz text; d date; qid uuid; sens boolean; q public.daily_questions%rowtype; mine boolean; theirs boolean; k text; ap text;
begin
  if cid is null then return null; end if;
  select timezone, kind, active_pack into tz, k, ap from public.couples where id = cid;
  d := (now() at time zone coalesce(tz,'Asia/Ho_Chi_Minh'))::date;
  sens := (select count(*) from public.pack_consents where couple_id = cid and agreed) >= 2;
  select question_id into qid from public.couple_questions where couple_id = cid and day = d;
  if qid is not null
     and not exists (select 1 from public.question_answers where couple_id = cid and answer_date = d)
     and exists (select 1 from public.daily_questions where id = qid and (
           (not sens and pack in ('family','money')) or (ap is not null and pack <> ap))) then
    delete from public.couple_questions where couple_id = cid and day = d;
    qid := null;
  end if;
  if qid is null then
    select dq.id into qid from public.daily_questions dq
      left join public.couple_question_passes p on p.couple_id = cid and p.question_id = dq.id
      where (sens or dq.pack not in ('family','money')) and k = any(dq.audience)
        and coalesce(p.excluded, false) = false
      order by (ap is not null and dq.pack <> ap),
               (select count(*) from public.couple_questions cq where cq.couple_id = cid and cq.question_id = dq.id) + coalesce(p.skips, 0), random()
      limit 1;
    if qid is null then return null; end if;
    insert into public.couple_questions (couple_id, day, question_id) values (cid, d, qid) on conflict do nothing;
    select question_id into qid from public.couple_questions where couple_id = cid and day = d;
  end if;
  select * into q from public.daily_questions where id = qid;
  select agreed into mine from public.pack_consents where couple_id = cid and user_id = auth.uid();
  select agreed into theirs from public.pack_consents where couple_id = cid and user_id <> auth.uid();
  return jsonb_build_object('date', d, 'id', q.id, 'pack', q.pack, 'text_vi', q.text_vi, 'text_vi_north', q.text_vi_north, 'text_vi_south', q.text_vi_south,
    'sensitive_on', sens, 'consent_mine', mine, 'consent_partner', theirs, 'active_pack', ap,
    'partner_answered', exists (select 1 from public.question_answers a where a.couple_id = cid and a.question_id = q.id and a.answer_date = d and a.user_id <> auth.uid()));
end $function$;

CREATE OR REPLACE FUNCTION public.pass_question(_mode text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare cid uuid := public.my_couple_id(); tz text; d date; k text; cur uuid; nextq uuid; sens boolean; ap text;
begin
  if cid is null then raise exception 'no couple'; end if;
  if _mode not in ('skip','na') then raise exception 'bad mode'; end if;
  perform pg_advisory_xact_lock(hashtext(cid::text || ':q'));
  select timezone, kind, active_pack into tz, k, ap from public.couples where id = cid;
  d := (now() at time zone coalesce(tz,'Asia/Ho_Chi_Minh'))::date;
  select question_id into cur from public.couple_questions where couple_id = cid and day = d;
  if cur is null then return jsonb_build_object('ok', false, 'reason', 'no_question'); end if;
  if exists (select 1 from public.question_answers a where a.couple_id = cid and a.question_id = cur and a.answer_date = d) then
    return jsonb_build_object('ok', false, 'reason', 'answered');
  end if;
  insert into public.couple_question_passes (couple_id, question_id, skips, excluded)
    values (cid, cur, case when _mode = 'skip' then 1 else 0 end, _mode = 'na')
  on conflict (couple_id, question_id) do update
    set skips = public.couple_question_passes.skips + case when _mode = 'skip' then 1 else 0 end,
        excluded = public.couple_question_passes.excluded or (_mode = 'na'),
        updated_at = now();
  delete from public.couple_questions where couple_id = cid and day = d;
  sens := (select count(*) from public.pack_consents where couple_id = cid and agreed) >= 2;
  select dq.id into nextq from public.daily_questions dq
    left join public.couple_question_passes p on p.couple_id = cid and p.question_id = dq.id
    where (sens or dq.pack not in ('family','money')) and k = any(dq.audience)
      and coalesce(p.excluded, false) = false and dq.id <> cur
    order by (ap is not null and dq.pack <> ap),
             (select count(*) from public.couple_questions cq where cq.couple_id = cid and cq.question_id = dq.id) + coalesce(p.skips, 0), random()
    limit 1;
  if nextq is null then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  insert into public.couple_questions (couple_id, day, question_id) values (cid, d, nextq) on conflict do nothing;
  return jsonb_build_object('ok', true);
end $function$;

REVOKE EXECUTE ON FUNCTION public.category_state(), public.request_category(text), public.respond_category(uuid, boolean), public.cancel_category(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.category_state(), public.request_category(text), public.respond_category(uuid, boolean), public.cancel_category(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.lock_active_pack() FROM PUBLIC, anon, authenticated;