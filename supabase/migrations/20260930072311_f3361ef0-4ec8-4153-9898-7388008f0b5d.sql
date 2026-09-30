
alter table public.game_content drop constraint game_content_type_check;
alter table public.game_content add constraint game_content_type_check check (type in ('this_or_that','who_more_likely','guess','rapid_qa','draw_duel'));
