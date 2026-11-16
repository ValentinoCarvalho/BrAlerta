# BR ALERTA

MVP acadêmico de uma plataforma CivicTech para registrar e acompanhar ocorrências urbanas em uma experiência cartográfica interativa. Os dados exibidos são fictícios e demonstrativos; a aplicação não possui vínculo oficial nem substitui canais municipais.

## Funcionalidades

- Mapa MapLibre navegável, inclinado em 3D e baseado em OpenStreetMap, sem chave privada.
- Alternância 2D/3D, zoom, rotação, inclinação e retorno à área inicial do Recreio dos Bandeirantes.
- 10 ocorrências fictícias georreferenciadas, filtros e detalhes com histórico.
- Cadastro completo por clique no mapa, validação, foto local opcional e persistência em `localStorage`.
- Página “Minhas ocorrências” e painel administrativo com atualização persistente de status.
- Layout responsivo, foco acessível e mensagens de loading, erro, vazio e sucesso contextual.
- Contrato `IncidentRepository`, implementações mock/Supabase e migração preparada para o banco remoto.

## Executar

Requer Node.js 20+.

```bash
npm install
npm run dev
```

Build e qualidade:

```bash
npm run build
npm run lint
npm run preview
```

## Arquitetura

- `src/components`: layout, mapa, formulários, detalhes e indicadores reutilizáveis.
- `src/pages`: mapa, ocorrências do cidadão, administração e página institucional.
- `src/repositories`: contrato de dados e implementação local.
- `src/context`: estado compartilhado e operações assíncronas.
- `src/data`: seed inicial gravado apenas quando não há dados no navegador.
- `supabase/migrations`: tabelas, validações, índices e RLS sem políticas públicas permissivas.

O perfil “Cidadão” e o perfil administrativo são apenas modos demonstrativos; não representam autenticação ou autorização real. O `SupabaseIncidentRepository` já implementa consulta, cadastro, objetos da cena e atualização de status/histórico, mas permanece desativado por padrão. Para ativá-lo, aplique as migrações, configure Auth e políticas RLS, preencha as variáveis de `.env.example` e defina `VITE_USE_SUPABASE=true`.

### Autenticação e papéis

Com o Supabase ativado, todas as páginas da aplicação exigem login. Novas contas recebem automaticamente um perfil `CITIZEN`; somente perfis `ADMIN` acessam `/admin` e podem atualizar status. A promoção nunca é feita pelo frontend. Depois que o usuário administrador criar e confirmar sua conta, execute no SQL Editor do Supabase:

```sql
update public.profiles
set role = 'ADMIN', updated_at = now()
where email = 'email-do-administrador@exemplo.com';
```

As políticas RLS continuam sendo a fonte de autorização mesmo que alguém tente acessar a API sem usar a interface.

## Limitações e próximos passos

A versão atual usa uma visualização cartográfica inclinada e marcadores georreferenciados estilizados. Ela **não implementa modelos GLB/GLTF ou extrusões reais de edifícios**, pois a fonte raster OSM escolhida não fornece footprints/alturas e o projeto não inclui modelos 3D. A evolução recomendada é adotar uma fonte vetorial licenciada, criar a camada de extrusão e integrar Three.js com modelos otimizados. Busca por endereço também permanece explicitamente simulada. Fotos pequenas são guardadas como data URL no armazenamento local e não são enviadas a servidor.
