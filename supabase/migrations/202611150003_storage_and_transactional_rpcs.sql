-- Fotos privadas e operações atômicas do BR Alerta.

alter table public.incidents add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'incident-photos',
  'incident-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "incident_photos_select_authenticated" on storage.objects;
create policy "incident_photos_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'incident-photos');

drop policy if exists "incident_photos_insert_own_folder" on storage.objects;
create policy "incident_photos_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'incident-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "incident_photos_delete_owner_or_admin" on storage.objects;
create policy "incident_photos_delete_owner_or_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'incident-photos'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

create or replace function public.create_incident_with_scene(
  p_category text,
  p_title text,
  p_description text,
  p_latitude double precision,
  p_longitude double precision,
  p_address text default null,
  p_photo_path text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_incident_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_category not in ('STREETLIGHT', 'POTHOLE') then raise exception 'Invalid category'; end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'Invalid coordinates'; end if;
  if p_photo_path is not null and split_part(p_photo_path, '/', 1) <> auth.uid()::text then raise exception 'Invalid photo owner'; end if;

  insert into public.incidents (
    user_id, category, title, description, latitude, longitude, address, status, photo_path
  ) values (
    auth.uid(), p_category, trim(p_title), trim(p_description), p_latitude, p_longitude,
    nullif(trim(p_address), ''), 'PENDING', p_photo_path
  ) returning id into new_incident_id;

  insert into public.scene_objects (
    incident_id, model_type, latitude, longitude, altitude, rotation, scale
  ) values (
    new_incident_id, p_category, p_latitude, p_longitude, 0, 0, 1
  );

  insert into public.incident_history (
    incident_id, previous_status, new_status, changed_by
  ) values (
    new_incident_id, null, 'PENDING', auth.uid()
  );

  return new_incident_id;
end;
$$;

revoke all on function public.create_incident_with_scene(text, text, text, double precision, double precision, text, text) from public;
grant execute on function public.create_incident_with_scene(text, text, text, double precision, double precision, text, text) to authenticated;

create or replace function public.update_incident_status(
  p_incident_id uuid,
  p_new_status text
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  old_status text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.is_admin() then raise exception 'Administrator permission required'; end if;
  if p_new_status not in ('PENDING', 'IN_PROGRESS', 'RESOLVED') then raise exception 'Invalid status'; end if;

  select status into old_status
  from public.incidents
  where id = p_incident_id
  for update;

  if not found then raise exception 'Incident not found'; end if;
  if old_status = p_new_status then return; end if;

  update public.incidents
  set status = p_new_status, updated_at = now()
  where id = p_incident_id;

  insert into public.incident_history (
    incident_id, previous_status, new_status, changed_by
  ) values (
    p_incident_id, old_status, p_new_status, auth.uid()
  );
end;
$$;

revoke all on function public.update_incident_status(uuid, text) from public;
grant execute on function public.update_incident_status(uuid, text) to authenticated;

comment on function public.create_incident_with_scene is 'Cria ocorrência, objeto da cena e primeiro histórico na mesma transação.';
comment on function public.update_incident_status is 'Atualiza status e histórico atomicamente; permitido apenas para administradores.';
