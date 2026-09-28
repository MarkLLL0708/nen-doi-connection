alter table public.profiles add column if not exists is_test_account boolean not null default false;

create or replace function public.protect_test_flag()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_test_account is distinct from old.is_test_account and coalesce(auth.role(), '') <> 'service_role' then
    new.is_test_account := old.is_test_account;
  end if;
  return new;
end $$;
revoke execute on function public.protect_test_flag() from anon, authenticated, public;

drop trigger if exists protect_test_flag on public.profiles;
create trigger protect_test_flag before update on public.profiles for each row execute function public.protect_test_flag();

create or replace function public.protect_test_flag_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then new.is_test_account := false; end if;
  return new;
end $$;
revoke execute on function public.protect_test_flag_insert() from anon, authenticated, public;
drop trigger if exists protect_test_flag_insert on public.profiles;
create trigger protect_test_flag_insert before insert on public.profiles for each row execute function public.protect_test_flag_insert();