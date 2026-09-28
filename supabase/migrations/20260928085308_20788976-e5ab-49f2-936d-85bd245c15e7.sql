
revoke execute on function public.handle_new_user(), public.trg_answer_streak(), public.trg_photo_streak(), public.trg_game_streak() from public, anon, authenticated;
revoke execute on function public.my_couple_id(), public.couple_size(uuid), public.has_answered(uuid, date), public.has_posted(date), public.has_responded(uuid) from public, anon;
grant execute on function public.my_couple_id(), public.couple_size(uuid), public.has_answered(uuid, date), public.has_posted(date), public.has_responded(uuid) to authenticated;
