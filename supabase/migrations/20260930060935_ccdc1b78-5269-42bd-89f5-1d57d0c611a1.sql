CREATE TABLE IF NOT EXISTS public.couple_question_passes (
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.daily_questions(id) ON DELETE CASCADE,
  skips integer NOT NULL DEFAULT 0,
  excluded boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (couple_id, question_id)
);

GRANT SELECT ON public.couple_question_passes TO authenticated;
GRANT ALL ON public.couple_question_passes TO service_role;

ALTER TABLE public.couple_question_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their own passes" ON public.couple_question_passes
  FOR SELECT TO authenticated USING (couple_id = public.my_couple_id());

CREATE OR REPLACE FUNCTION public.pass_question(_mode text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare cid uuid := public.my_couple_id(); tz text; d date; k text; cur uuid; nextq uuid; sens boolean;
begin
  if cid is null then raise exception 'no couple'; end if;
  if _mode not in ('skip','na') then raise exception 'bad mode'; end if;
  perform pg_advisory_xact_lock(hashtext(cid::text || ':q'));
  select timezone, kind into tz, k from public.couples where id = cid;
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
    order by (select count(*) from public.couple_questions cq where cq.couple_id = cid and cq.question_id = dq.id) + coalesce(p.skips, 0), random()
    limit 1;
  if nextq is null then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  insert into public.couple_questions (couple_id, day, question_id) values (cid, d, nextq) on conflict do nothing;
  return jsonb_build_object('ok', true);
end $function$;

REVOKE EXECUTE ON FUNCTION public.pass_question(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.pass_question(text) TO authenticated;

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
      left join public.couple_question_passes p on p.couple_id = cid and p.question_id = dq.id
      where (sens or dq.pack not in ('family','money')) and k = any(dq.audience)
        and coalesce(p.excluded, false) = false
      order by (select count(*) from public.couple_questions cq where cq.couple_id = cid and cq.question_id = dq.id) + coalesce(p.skips, 0), random()
      limit 1;
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