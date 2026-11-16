-- Perfis e autorização do BR Alerta.
-- Todo novo usuário começa como CITIZEN. ADMIN só pode ser atribuído por operação administrativa no banco.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  role text not null default 'CITIZEN' check (role in ('CITIZEN', 'ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create unique index if not exists profiles_email_lower_idx on public.profiles(lower(email));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'Usuário'), '@', 1)),
    'CITIZEN'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Cria perfis para usuários que eventualmente já existam antes desta migração.
insert into public.profiles (id, email, full_name, role)
select id, coalesce(email, ''), coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(email, 'Usuário'), '@', 1)), 'CITIZEN'
from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user_id and role = 'ADMIN'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- Vincula os dados de domínio aos usuários do Auth.
alter table public.incidents
  drop constraint if exists incidents_user_id_fkey,
  add constraint incidents_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.incident_history
  drop constraint if exists incident_history_changed_by_fkey,
  add constraint incident_history_changed_by_fkey foreign key (changed_by) references auth.users(id) on delete set null;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

-- Não há policy de UPDATE em profiles: usuários não podem promover o próprio papel.

drop policy if exists "incidents_select_authenticated" on public.incidents;
create policy "incidents_select_authenticated"
on public.incidents for select
to authenticated
using (true);

drop policy if exists "incidents_insert_own" on public.incidents;
create policy "incidents_insert_own"
on public.incidents for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "incidents_update_admin" on public.incidents;
create policy "incidents_update_admin"
on public.incidents for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "scene_objects_select_authenticated" on public.scene_objects;
create policy "scene_objects_select_authenticated"
on public.scene_objects for select
to authenticated
using (true);

drop policy if exists "scene_objects_insert_owner_or_admin" on public.scene_objects;
create policy "scene_objects_insert_owner_or_admin"
on public.scene_objects for insert
to authenticated
with check (
  public.is_admin() or exists (
    select 1 from public.incidents i
    where i.id = incident_id and i.user_id = auth.uid()
  )
);

drop policy if exists "history_select_authenticated" on public.incident_history;
create policy "history_select_authenticated"
on public.incident_history for select
to authenticated
using (true);

drop policy if exists "history_insert_owner_or_admin" on public.incident_history;
create policy "history_insert_owner_or_admin"
on public.incident_history for insert
to authenticated
with check (
  changed_by = auth.uid() and (
    public.is_admin() or exists (
      select 1 from public.incidents i
      where i.id = incident_id and i.user_id = auth.uid()
    )
  )
);

grant select on public.profiles to authenticated;
grant select, insert, update on public.incidents to authenticated;
grant select, insert on public.scene_objects to authenticated;
grant select, insert on public.incident_history to authenticated;

comment on column public.profiles.role is 'CITIZEN por padrão; ADMIN somente por operação administrativa confiável.';
