begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(20);

select has_table('public', 'profiles', 'profiles existe');
select has_table('public', 'notification_reads', 'estado de leitura das notificações existe');
select ok((select relrowsecurity from pg_class where oid = 'public.incidents'::regclass), 'RLS ativo em incidents');
select ok((select relrowsecurity from pg_class where oid = 'public.scene_objects'::regclass), 'RLS ativo em scene_objects');
select ok((select relrowsecurity from pg_class where oid = 'public.incident_history'::regclass), 'RLS ativo em incident_history');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'RLS ativo em profiles');
select ok((select relrowsecurity from pg_class where oid = 'public.notification_reads'::regclass), 'RLS ativo em notification_reads');

select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='incidents' and policyname='incidents_insert_own'), 1, 'cidadão cria ocorrência própria');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='incidents' and policyname='incidents_update_admin'), 1, 'somente admin atualiza ocorrência');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='incident_history' and policyname='history_insert_owner_or_admin'), 1, 'histórico protegido');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='scene_objects' and policyname='scene_objects_insert_owner_or_admin'), 1, 'objetos protegidos');
select is((select count(*)::integer from pg_policies where schemaname='storage' and tablename='objects' and policyname='incident_photos_insert_own_folder'), 1, 'upload limitado à pasta própria');
select is((select count(*)::integer from pg_policies where schemaname='storage' and tablename='objects' and policyname='incident_photos_delete_owner_or_admin'), 1, 'exclusão de foto protegida');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='notification_reads' and policyname='notification_reads_select_own'), 1, 'usuário consulta apenas as próprias notificações lidas');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='notification_reads' and policyname='notification_reads_insert_own'), 1, 'usuário marca apenas as próprias notificações como lidas');

select has_function('public', 'create_incident_with_scene', array['text','text','text','double precision','double precision','text','text'], 'RPC de cadastro existe');
select has_function('public', 'update_incident_status', array['uuid','text'], 'RPC de status existe');
select has_function('public', 'update_own_pending_incident', array['uuid','text','text','text'], 'RPC de edição própria pendente existe');
select has_function('public', 'cancel_own_pending_incident', array['uuid'], 'RPC de cancelamento próprio pendente existe');
select is((select file_size_limit::bigint from storage.buckets where id='incident-photos'), 5242880::bigint, 'bucket limita arquivos a 5 MB');

select * from finish();
rollback;
