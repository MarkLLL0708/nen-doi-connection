CREATE OR REPLACE FUNCTION public.log_thumb_sync() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c uuid := public.my_couple_id();
BEGIN
  IF _c IS NULL OR public.couple_size(_c) < 2 THEN RAISE EXCEPTION 'not paired'; END IF;
  -- Both phones report the same sync; keep one row (and one pair of notices) per 5 seconds.
  IF NOT EXISTS (SELECT 1 FROM thumb_syncs WHERE couple_id = _c AND created_at > now() - interval '5 seconds') THEN
    INSERT INTO thumb_syncs(couple_id) VALUES (_c);
    INSERT INTO notifications(user_id, kind, data)
      SELECT user_id, 'thumb_synced', '{}'::jsonb FROM couple_members WHERE couple_id = _c;
  END IF;
  RETURN (SELECT count(*)::int FROM thumb_syncs WHERE couple_id = _c);
END $$;