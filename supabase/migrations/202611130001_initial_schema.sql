-- Esquema futuro. Antes de produção, habilite autenticação e RLS com políticas por usuário/perfil.
create extension if not exists pgcrypto;
create table incidents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  category text not null check (category in ('STREETLIGHT','POTHOLE')),
  title text not null check (char_length(title) between 1 and 80), description text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180), address text,
  status text not null default 'PENDING' check (status in ('PENDING','IN_PROGRESS','RESOLVED')),
  photo_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table scene_objects (id uuid primary key default gen_random_uuid(), incident_id uuid not null references incidents(id) on delete cascade, model_type text not null check(model_type in ('STREETLIGHT','POTHOLE')), latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180), altitude double precision not null default 0, rotation double precision not null default 0, scale double precision not null default 1);
create table incident_history (id uuid primary key default gen_random_uuid(), incident_id uuid not null references incidents(id) on delete cascade, previous_status text check(previous_status in ('PENDING','IN_PROGRESS','RESOLVED')), new_status text not null check(new_status in ('PENDING','IN_PROGRESS','RESOLVED')), changed_by uuid, changed_at timestamptz not null default now());
create index incidents_status_idx on incidents(status); create index incidents_category_idx on incidents(category); create index incidents_created_at_idx on incidents(created_at desc); create index history_incident_idx on incident_history(incident_id,changed_at desc);
alter table incidents enable row level security; alter table scene_objects enable row level security; alter table incident_history enable row level security;
-- Nenhuma política permissiva é criada de propósito.
