
create table public.draw_rounds (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  prompt text not null,
  created_by uuid not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.draw_rounds to authenticated;
grant all on public.draw_rounds to service_role;
alter table public.draw_rounds enable row level security;
create policy "draw_rounds_read" on public.draw_rounds for select to authenticated using (couple_id = public.my_couple_id());
create policy "draw_rounds_insert" on public.draw_rounds for insert to authenticated with check (couple_id = public.my_couple_id() and created_by = auth.uid());
create index draw_rounds_couple_idx on public.draw_rounds (couple_id, created_at desc);

create table public.drawings (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null,
  round_id uuid references public.draw_rounds(id) on delete cascade,
  image text not null,
  reply_to uuid references public.drawings(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index drawings_round_user_idx on public.drawings (round_id, user_id) where round_id is not null;
create index drawings_couple_idx on public.drawings (couple_id, created_at desc);
grant select, insert, delete on public.drawings to authenticated;
grant all on public.drawings to service_role;
alter table public.drawings enable row level security;

create or replace function public.duel_complete(_round uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (select count(distinct user_id) from public.drawings where round_id = _round) >= 2
$$;

create policy "drawings_read" on public.drawings for select to authenticated
  using (couple_id = public.my_couple_id() and (round_id is null or user_id = auth.uid() or public.duel_complete(round_id)));
create policy "drawings_insert" on public.drawings for insert to authenticated
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());
create policy "drawings_delete" on public.drawings for delete to authenticated
  using (user_id = auth.uid());

create table public.draw_votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.draw_rounds(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null,
  liked_user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (round_id, user_id)
);
grant select, insert on public.draw_votes to authenticated;
grant all on public.draw_votes to service_role;
alter table public.draw_votes enable row level security;
create policy "draw_votes_read" on public.draw_votes for select to authenticated using (couple_id = public.my_couple_id());
create policy "draw_votes_insert" on public.draw_votes for insert to authenticated with check (couple_id = public.my_couple_id() and user_id = auth.uid());

create or replace function public.trg_drawing_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, data)
  select m.user_id, case when new.round_id is null then 'drawing_received' else 'duel_drawing' end, '{}'::jsonb
  from public.couple_members m
  where m.couple_id = new.couple_id and m.user_id <> new.user_id;
  return new;
end $$;
revoke execute on function public.trg_drawing_notify() from authenticated, anon;
create trigger drawing_notify after insert on public.drawings for each row execute function public.trg_drawing_notify();

create or replace function public.trg_duel_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, data)
  select m.user_id, 'duel_started', jsonb_build_object('prompt', new.prompt)
  from public.couple_members m
  where m.couple_id = new.couple_id and m.user_id <> new.created_by;
  return new;
end $$;
revoke execute on function public.trg_duel_notify() from authenticated, anon;
create trigger duel_notify after insert on public.draw_rounds for each row execute function public.trg_duel_notify();
