# BR ALERTA

MVP acadêmico de uma plataforma CivicTech para registrar e acompanhar ocorrências urbanas em uma experiência cartográfica interativa. Os dados exibidos são fictícios e demonstrativos; a aplicação não possui vínculo oficial nem substitui canais municipais.

## Funcionalidades

- Mapa MapLibre navegável, inclinado em 3D e baseado em OpenStreetMap, sem chave privada.
- Alternância 2D/3D, zoom, rotação, inclinação e retorno à área inicial do Recreio dos Bandeirantes.
- 10 ocorrências fictícias georreferenciadas, filtros e detalhes com histórico.
- Cadastro completo por clique no mapa, validação, foto local opcional e persistência em `localStorage`.
- Página “Minhas ocorrências” e painel administrativo com atualização persistente de status.
- Central de notificações com novos registros, edições e mudanças de status; mensagens abrem a ocorrência no mapa e podem ser marcadas como lidas.
- Em “Minhas ocorrências”, o cidadão pode editar categoria, título e descrição ou cancelar um registro pendente; localização e foto permanecem inalteradas.
- Notificações lidas são salvas por usuário (localmente no modo demonstrativo e no Supabase no modo conectado).
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

## Estrutura do frontend

- Vite com React e TypeScript; a configuração de compilação também verifica os tipos.
- Tailwind CSS v4 integrado pelo plugin do Vite. As utilities podem ser usadas incrementalmente nos componentes.
- Os estilos existentes em `src/styles.css` foram mantidos; o reset global do Tailwind não é carregado para evitar mudanças visuais involuntárias.
- As rotas ficam em `src/App.tsx`, com `react-router-dom`; `src/components/layout` compartilha o layout e `src/pages` contém as telas.

## Arquitetura

- `src/components`: layout, mapa, formulários, detalhes e indicadores reutilizáveis.
- `src/pages`: mapa, ocorrências do cidadão, administração e página institucional.
- `src/repositories`: contrato de dados e implementação local.
- `src/context`: estado compartilhado e operações assíncronas.
- `src/data`: seed inicial gravado apenas quando não há dados no navegador.
- `supabase/migrations`: tabelas, validações, índices e RLS sem políticas públicas permissivas.

Sem `VITE_USE_SUPABASE=true`, login e cadastro funcionam em modo demonstrativo local: o login aceita um e-mail válido e qualquer senha não vazia, não salva a senha e cria apenas perfis de cidadão. Cada e-mail identifica seu próprio estado demonstrativo, que não autentica no servidor. A opção “Entrar com outro usuário” no menu do perfil permite voltar ao login. No Supabase, RPCs protegidas permitem editar ou cancelar somente ocorrências pendentes do próprio cidadão; ambas preservam o histórico. As leituras das notificações também são vinculadas ao usuário.

### Conectar a um projeto Supabase

1. Aplique os arquivos de `supabase/migrations` em ordem crescente no SQL Editor do projeto.
2. Copie `.env.example` para `.env.local` e informe a URL do projeto e a publishable key:

   ```env
   VITE_USE_SUPABASE=true
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   VITE_ENABLE_REALTIME=true
   ```

3. Habilite autenticação por e-mail/senha e reinicie o servidor Vite.
4. Para atualizações em tempo real, habilite `incidents`, `incident_history` e `notification_reads` na publicação `supabase_realtime`.

`.env.local` está no `.gitignore`. Não use nem compartilhe uma `service_role` key no frontend. Os testes automatizados simulam as respostas do Supabase; validar o projeto remoto exige credenciais configuradas localmente.

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
