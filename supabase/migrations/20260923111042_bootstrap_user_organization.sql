create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.bootstrap_user_workspace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_id uuid;
  display_name text;
begin
  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(coalesce(new.email, ''), '@', 1),
    '사용자'
  );

  insert into public.profiles (id, display_name)
  values (new.id, display_name)
  on conflict (id) do nothing;

  if not exists (
    select 1 from public.organization_members where user_id = new.id
  ) then
    insert into public.organizations (name)
    values (display_name || ' 조직')
    returning id into organization_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (organization_id, new.id, 'owner');
  end if;

  return new;
end;
$$;

revoke all on function private.bootstrap_user_workspace() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.bootstrap_user_workspace();

insert into public.profiles (id, display_name)
select
  id,
  coalesce(
    nullif(raw_user_meta_data ->> 'display_name', ''),
    nullif(raw_user_meta_data ->> 'full_name', ''),
    split_part(coalesce(email, ''), '@', 1),
    '사용자'
  )
from auth.users
on conflict (id) do nothing;

do $$
declare
  existing_user record;
  organization_id uuid;
  display_name text;
begin
  for existing_user in
    select u.id, u.email, u.raw_user_meta_data
    from auth.users u
    where not exists (
      select 1 from public.organization_members m where m.user_id = u.id
    )
  loop
    display_name := coalesce(
      nullif(existing_user.raw_user_meta_data ->> 'display_name', ''),
      nullif(existing_user.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(existing_user.email, ''), '@', 1),
      '사용자'
    );

    insert into public.organizations (name)
    values (display_name || ' 조직')
    returning id into organization_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (organization_id, existing_user.id, 'owner');
  end loop;
end;
$$;

create index if not exists organization_members_user_idx
  on public.organization_members(user_id);
