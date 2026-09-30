CREATE TABLE public.thumb_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX thumb_syncs_couple_idx ON public.thumb_syncs(couple_id, created_at DESC);
GRANT SELECT ON public.thumb_syncs TO authenticated;
GRANT ALL ON public.thumb_syncs TO service_role;
ALTER TABLE public.thumb_syncs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read their own syncs" ON public.thumb_syncs FOR SELECT TO authenticated USING (couple_id = public.my_couple_id());

CREATE OR REPLACE FUNCTION public.log_thumb_sync() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c uuid := public.my_couple_id();
BEGIN
  IF _c IS NULL OR public.couple_size(_c) < 2 THEN RAISE EXCEPTION 'not paired'; END IF;
  -- Both phones report the same sync; keep one row per 5 seconds.
  IF NOT EXISTS (SELECT 1 FROM thumb_syncs WHERE couple_id = _c AND created_at > now() - interval '5 seconds') THEN
    INSERT INTO thumb_syncs(couple_id) VALUES (_c);
  END IF;
  RETURN (SELECT count(*)::int FROM thumb_syncs WHERE couple_id = _c);
END $$;

CREATE OR REPLACE FUNCTION public.send_thumb_nudge() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c uuid := public.my_couple_id(); _p uuid;
BEGIN
  IF _c IS NULL THEN RAISE EXCEPTION 'not paired'; END IF;
  SELECT user_id INTO _p FROM couple_members WHERE couple_id = _c AND user_id <> auth.uid() LIMIT 1;
  IF _p IS NULL THEN RAISE EXCEPTION 'not paired'; END IF;
  IF EXISTS (SELECT 1 FROM notifications WHERE user_id = _p AND kind = 'thumb_nudge'
             AND data->>'from' = auth.uid()::text AND created_at > now() - interval '60 seconds') THEN
    RETURN false;
  END IF;
  INSERT INTO notifications(user_id, kind, data) VALUES (_p, 'thumb_nudge', jsonb_build_object('from', auth.uid()));
  RETURN true;
END $$;

REVOKE EXECUTE ON FUNCTION public.log_thumb_sync() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_thumb_nudge() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_thumb_sync() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_thumb_nudge() TO authenticated;