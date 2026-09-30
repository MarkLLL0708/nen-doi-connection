-- Serialize free-plan seals by sender before counting already-sealed letters.
CREATE OR REPLACE FUNCTION public.seal_capsule(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.capsules%rowtype; lim int; premium boolean; active int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  -- Every sealing call for this sender takes the same transaction-scoped lock.
  PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  SELECT * INTO c FROM public.capsules WHERE id = _id AND sender_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR c.status <> 'draft' THEN RAISE EXCEPTION 'not a draft'; END IF;
  IF c.type IN ('birthday','anniversary') AND (c.unlock_on IS NULL OR c.unlock_on <= public.capsule_local_today(c.couple_id)) THEN RAISE EXCEPTION 'pick a future date'; END IF;
  IF c.type NOT IN ('birthday','anniversary') THEN c.unlock_on := NULL; END IF;
  IF char_length(trim(c.body)) = 0 AND c.photo_path IS NULL AND c.voice_path IS NULL THEN RAISE EXCEPTION 'empty'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.couple_id = c.couple_id AND s.plan <> 'free' AND s.status = 'active') INTO premium;
  IF NOT premium THEN
    SELECT coalesce((SELECT (value #>> '{}')::int FROM public.app_settings WHERE key = 'free_active_capsules'), 1) INTO lim;
    SELECT count(*) INTO active FROM public.capsules WHERE sender_id = auth.uid() AND status = 'sealed';
    IF active >= lim THEN RAISE EXCEPTION 'capsule limit'; END IF;
  END IF;
  UPDATE public.capsules SET status = 'sealed', sealed_at = now(), unlock_on = c.unlock_on WHERE id = _id;
  IF c.type NOT IN ('birthday','anniversary') THEN
    INSERT INTO public.notifications (user_id, kind, data) VALUES (c.recipient_id, 'capsule_received', jsonb_build_object('capsule_id', c.id, 'type', c.type));
    UPDATE public.capsules SET notified_at = now() WHERE id = _id;
  END IF;
END $$;

-- Duel status is readable only for the caller's own pair, including when called by the drawing reveal policy.
CREATE OR REPLACE FUNCTION public.duel_complete(_round uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.draw_rounds dr
    WHERE dr.id = _round AND dr.couple_id = public.my_couple_id()
      AND (SELECT count(DISTINCT d.user_id) FROM public.drawings d WHERE d.round_id = dr.id) >= 2)
$$;
REVOKE EXECUTE ON FUNCTION public.duel_complete(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.duel_complete(uuid) TO authenticated;

-- Every game reveal/status helper checks the session or round is in the caller's pair.
CREATE OR REPLACE FUNCTION public.round_completed(_round uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.game_rounds gr
    WHERE gr.id = _round AND gr.couple_id = public.my_couple_id()
      AND (SELECT count(*) FROM (
        SELECT r.user_id FROM public.game_responses r JOIN public.game_sessions s ON s.id = r.session_id
        WHERE s.round_id = gr.id GROUP BY r.user_id
        HAVING count(*) >= (SELECT count(*) FROM public.game_sessions WHERE round_id = gr.id)
      ) x) >= 2)
$$;
CREATE OR REPLACE FUNCTION public.can_see_response(_session uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE rid uuid;
BEGIN
  SELECT round_id INTO rid FROM public.game_sessions WHERE id = _session AND couple_id = public.my_couple_id();
  IF NOT FOUND THEN RETURN false; END IF;
  IF rid IS NULL THEN RETURN public.has_responded(_session); END IF;
  RETURN public.round_completed(rid);
END $$;

-- Count only the caller's pair when this helper is invoked directly.
CREATE OR REPLACE FUNCTION public.couple_size(_couple uuid) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN _couple = public.my_couple_id()
    THEN (SELECT count(*)::int FROM public.couple_members WHERE couple_id = _couple)
    ELSE NULL::integer END
$$;
-- Joining by a valid locked invite still needs to count the destination pair before membership exists.
CREATE OR REPLACE FUNCTION public.join_couple(_code text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv public.invites%rowtype; pc text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.couple_members WHERE user_id = auth.uid()) THEN RAISE EXCEPTION 'already in a couple'; END IF;
  SELECT * INTO inv FROM public.invites WHERE code = upper(trim(_code)) FOR UPDATE;
  IF NOT FOUND OR inv.used_by IS NOT NULL OR inv.expires_at < now() THEN RAISE EXCEPTION 'invalid code'; END IF;
  IF (SELECT count(*) FROM public.couple_members WHERE couple_id = inv.couple_id) >= 2 THEN RAISE EXCEPTION 'couple full'; END IF;
  SELECT partner_city INTO pc FROM public.couples WHERE id = inv.couple_id;
  INSERT INTO public.couple_members (couple_id, user_id, city) VALUES (inv.couple_id, auth.uid(), pc);
  UPDATE public.invites SET used_by = auth.uid(), used_at = now() WHERE code = inv.code;
  RETURN inv.couple_id;
END $$;

-- Policy callers pass auth.uid(); arbitrary-user role probes return false.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role)
$$;