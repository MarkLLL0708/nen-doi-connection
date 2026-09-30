-- 1. Live delivery for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;

-- 2. Notify the partner about answers, photos and game turns
CREATE OR REPLACE FUNCTION public.notify_partner_activity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p uuid; k text;
BEGIN
  SELECT user_id INTO p FROM couple_members WHERE couple_id = NEW.couple_id AND user_id <> NEW.user_id LIMIT 1;
  IF p IS NULL THEN RETURN NEW; END IF;
  k := CASE TG_TABLE_NAME
    WHEN 'question_answers' THEN 'question_answered'
    WHEN 'photo_posts' THEN 'photo_received'
    ELSE 'game_turn' END;
  INSERT INTO notifications(user_id, kind, data) VALUES (p, k, jsonb_build_object('from', NEW.user_id));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_answer ON public.question_answers;
CREATE TRIGGER notify_answer AFTER INSERT ON public.question_answers
  FOR EACH ROW EXECUTE FUNCTION public.notify_partner_activity();
DROP TRIGGER IF EXISTS notify_photo ON public.photo_posts;
CREATE TRIGGER notify_photo AFTER INSERT ON public.photo_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_partner_activity();
DROP TRIGGER IF EXISTS notify_game ON public.game_responses;
CREATE TRIGGER notify_game AFTER INSERT ON public.game_responses
  FOR EACH ROW EXECUTE FUNCTION public.notify_partner_activity();

-- 3. Solo users may set the topic directly; paired couples still need both to agree
CREATE OR REPLACE FUNCTION public.request_category(_pack text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid := public.my_couple_id(); k text; ap text; sens boolean; p uuid; rid uuid; ex record;
BEGIN
  IF cid IS NULL THEN RAISE EXCEPTION 'not paired'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(cid::text || ':cat'));
  SELECT kind, active_pack INTO k, ap FROM couples WHERE id = cid;
  IF _pack = ap THEN RETURN NULL; END IF;
  sens := (SELECT count(*) FROM pack_consents WHERE couple_id = cid AND agreed) >= 2;
  IF NOT EXISTS (SELECT 1 FROM daily_questions WHERE pack = _pack AND k = ANY(audience) AND (sens OR pack NOT IN ('family','money'))) THEN
    RAISE EXCEPTION 'category unavailable';
  END IF;

  -- Alone in the pair: switch straight away, nobody to ask.
  IF public.couple_size(cid) < 2 THEN
    UPDATE category_requests SET status = 'cancelled', decided_at = now() WHERE couple_id = cid AND status = 'pending';
    PERFORM set_config('app.category_switch', 'on', true);
    UPDATE couples SET active_pack = _pack WHERE id = cid;
    PERFORM set_config('app.category_switch', 'off', true);
    RETURN NULL;
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
