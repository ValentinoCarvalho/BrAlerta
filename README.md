# BR ALERTA

MVP acadêmico de uma plataforma CivicTech para registrar e acompanhar ocorrências urbanas em uma experiência cartográfica interativa. Os dados exibidos são fictícios e demonstrativos; a aplicação não possui vínculo oficial nem substitui canais municipais.

## Funcionalidades

- Mapa MapLibre navegável, inclinado em 3D e baseado em OpenStreetMap, sem chave privada.
- Alternância 2D/3D, zoom, rotação, inclinação e retorno à área inicial do Recreio dos Bandeirantes.
- 10 ocorrências fictícias georreferenciadas, filtros e detalhes com histórico.
- Cadastro completo por clique no mapa, validação, foto local opcional e persistência em `localStorage`.
- Página “Minhas ocorrências” e painel administrativo com atualização persistente de status.
- Layout responsivo, foco acessível e mensagens de loading, erro, vazio e sucesso contextual.
- Contrato `IncidentRepository`, implementação mock e migração preparada para Supabase.

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

O perfil “Cidadão” e o perfil administrativo são apenas modos demonstrativos; não representam autenticação ou autorização real. Para usar Supabase, implemente `SupabaseIncidentRepository`, configure as variáveis de `.env.example`, autenticação e políticas RLS por usuário/papel antes de disponibilizar escrita.

## Limitações e próximos passos

A versão atual usa uma visualização cartográfica inclinada e marcadores georreferenciados estilizados. Ela **não implementa modelos GLB/GLTF ou extrusões reais de edifícios**, pois a fonte raster OSM escolhida não fornece footprints/alturas e o projeto não inclui modelos 3D. A evolução recomendada é adotar uma fonte vetorial licenciada, criar a camada de extrusão e integrar Three.js com modelos otimizados. Busca por endereço também permanece explicitamente simulada. Fotos pequenas são guardadas como data URL no armazenamento local e não são enviadas a servidor.
