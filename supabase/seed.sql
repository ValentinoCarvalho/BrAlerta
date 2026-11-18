-- =====================================================================
-- BR ALERTA - Ocorrências fictícias para demonstração (modo Supabase)
-- Responsável: Gabriela Neves (Pesquisa, qualidade e apresentação)
--
-- Todos os dados abaixo são FICTÍCIOS e servem só para testes e para a
-- apresentação. Nenhuma ocorrência representa um problema real.
--
-- Como usar:
--   1. Aplique as migrações da pasta supabase/migrations.
--   2. Crie pelo menos uma conta na aplicação (tela "Criar conta").
--   3. Cole este arquivo no SQL Editor do Supabase e clique em "Run".
--      O SQL Editor roda como administrador do banco, então as regras
--      de RLS não bloqueiam a carga.
--
-- As ocorrências ficam em nome da conta criada primeiro.
-- Para apagar só estes dados depois:
--   delete from public.incidents where title like '[DEMO]%';
-- =====================================================================

do $$
declare
  demo_user uuid;
  new_id uuid;
  r record;
begin
  select id into demo_user from auth.users order by created_at limit 1;
  if demo_user is null then
    raise exception 'Crie uma conta na aplicação antes de rodar o seed.';
  end if;

  for r in
    select * from (values
      -- categoria,    título,                                              descrição,                                                                                   lat,       lng,       status,        dias atrás
      ('STREETLIGHT', '[DEMO] Poste apagado em frente à escola',             'Poste sem luz há cerca de uma semana. Alunos do turno da noite saem com a rua escura.',      -23.02440, -43.46420, 'PENDING',     1),
      ('POTHOLE',     '[DEMO] Buraco grande na faixa da direita',            'Buraco de aproximadamente 1 metro. Carros desviam para a faixa ao lado sem sinalizar.',      -23.02600, -43.46620, 'IN_PROGRESS', 2),
      ('STREETLIGHT', '[DEMO] Dois postes apagados perto do ponto de ônibus', 'Quem espera o ônibus depois das 19h fica no escuro. Moradores relatam medo de assalto.',   -23.02280, -43.46270, 'PENDING',     3),
      ('POTHOLE',     '[DEMO] Buraco na faixa de pedestres',                 'Buraco bem na travessia. Risco de queda para idosos, crianças e cadeirantes.',              -23.02710, -43.46390, 'RESOLVED',    9),
      ('POTHOLE',     '[DEMO] Asfalto afundado depois da chuva',             'O afundamento aumenta a cada chuva forte e acumula água, escondendo o buraco.',             -23.02800, -43.46740, 'PENDING',     4),
      ('STREETLIGHT', '[DEMO] Lâmpada piscando a noite toda',                'A lâmpada acende e apaga sem parar. Incomoda os moradores e deixa a esquina mal iluminada.', -23.02090, -43.46510, 'IN_PROGRESS', 5),
      ('POTHOLE',     '[DEMO] Buraco na ciclovia',                           'Buraco no meio da ciclovia. Ciclistas precisam sair para a pista dos carros.',              -23.02480, -43.46900, 'PENDING',     2),
      ('STREETLIGHT', '[DEMO] Praça sem iluminação',                         'Todos os postes internos da praça estão apagados. Famílias deixaram de usar o espaço à noite.', -23.02170, -43.45980, 'RESOLVED',   12),
      ('POTHOLE',     '[DEMO] Sequência de buracos na rua comercial',        'Vários buracos em sequência no mesmo quarteirão. Motociclistas de entrega reclamam de quedas.', -23.02510, -43.46080, 'IN_PROGRESS', 6),
      ('STREETLIGHT', '[DEMO] Poste apagado na saída do condomínio',         'Saída de veículos e pedestres sem iluminação. Pouca visibilidade para quem atravessa.',     -23.02360, -43.46800, 'PENDING',     1),
      ('POTHOLE',     '[DEMO] Tampa de bueiro afundada',                     'Desnível em volta da tampa do bueiro. Pneus de carro já foram danificados no local.',       -23.02650, -43.46150, 'PENDING',     3),
      ('STREETLIGHT', '[DEMO] Rua inteira sem luz',                          'Todos os postes da rua apagaram ao mesmo tempo depois de uma tempestade.',                 -23.02920, -43.46450, 'IN_PROGRESS', 7)
    ) as t(category, title, description, lat, lng, status, days_ago)
  loop
    insert into public.incidents (user_id, category, title, description, latitude, longitude, address, status, created_at, updated_at)
    values (demo_user, r.category, r.title, r.description, r.lat, r.lng,
            'Recreio dos Bandeirantes, Rio de Janeiro — RJ', r.status,
            now() - make_interval(days => r.days_ago), now() - make_interval(days => r.days_ago))
    returning id into new_id;

    insert into public.scene_objects (incident_id, model_type, latitude, longitude)
    values (new_id, r.category, r.lat, r.lng);

    -- Primeiro registro do histórico: ocorrência criada como Pendente.
    insert into public.incident_history (incident_id, previous_status, new_status, changed_by, changed_at)
    values (new_id, null, 'PENDING', demo_user, now() - make_interval(days => r.days_ago));

    -- Se o status atual não for Pendente, registra a mudança no histórico.
    if r.status = 'IN_PROGRESS' then
      insert into public.incident_history (incident_id, previous_status, new_status, changed_by, changed_at)
      values (new_id, 'PENDING', 'IN_PROGRESS', demo_user, now() - make_interval(days => greatest(r.days_ago - 1, 0)));
    elsif r.status = 'RESOLVED' then
      insert into public.incident_history (incident_id, previous_status, new_status, changed_by, changed_at)
      values (new_id, 'PENDING', 'IN_PROGRESS', demo_user, now() - make_interval(days => r.days_ago - 2)),
             (new_id, 'IN_PROGRESS', 'RESOLVED', demo_user, now() - make_interval(days => r.days_ago - 5));
    end if;
  end loop;
end $$;
