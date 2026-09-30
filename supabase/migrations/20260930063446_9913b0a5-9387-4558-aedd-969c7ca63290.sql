ALTER TABLE public.thumb_syncs ADD COLUMN sync_date date;
UPDATE public.thumb_syncs t SET sync_date = (t.created_at at time zone coalesce((select timezone from public.couples c where c.id = t.couple_id), 'Asia/Ho_Chi_Minh'))::date;
CREATE OR REPLACE FUNCTION public.trg_thumb_sync_date() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.sync_date := public.capsule_local_today(NEW.couple_id); RETURN NEW; END $$;
CREATE TRIGGER thumb_sync_date BEFORE INSERT ON public.thumb_syncs FOR EACH ROW EXECUTE FUNCTION public.trg_thumb_sync_date();
ALTER TABLE public.thumb_syncs ALTER COLUMN sync_date SET NOT NULL;

create or replace function public.bump_streak(_couple uuid, _day date) returns void language plpgsql security definer set search_path = public as $$
declare s public.streaks%rowtype; both_done boolean; m date;
begin
  select (count(distinct u) >= 2) into both_done from (
    select user_id u from public.question_answers where couple_id = _couple and answer_date = _day
    union select user_id from public.photo_posts where couple_id = _couple and post_date = _day
    union select r.user_id from public.game_responses r join public.game_sessions g on g.id = r.session_id where r.couple_id = _couple and g.played_on = _day
    -- A thumb sync needs both partners holding at once, so it counts for both.
    union select cm.user_id from public.couple_members cm where cm.couple_id = _couple
      and exists (select 1 from public.thumb_syncs t where t.couple_id = _couple and t.sync_date = _day)
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
revoke execute on function public.bump_streak(uuid, date) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_thumb_streak() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.bump_streak(NEW.couple_id, NEW.sync_date); RETURN NEW; END $$;
CREATE TRIGGER thumb_streak AFTER INSERT ON public.thumb_syncs FOR EACH ROW EXECUTE FUNCTION public.trg_thumb_streak();

-- Live channel: only the two members of the pair may join / send on "thumb:<couple_id>".
CREATE POLICY "Pair members read their thumb channel" ON realtime.messages FOR SELECT TO authenticated
  USING (realtime.topic() = 'thumb:' || public.my_couple_id()::text);
CREATE POLICY "Pair members write their thumb channel" ON realtime.messages FOR INSERT TO authenticated
  WITH CHECK (realtime.topic() = 'thumb:' || public.my_couple_id()::text);