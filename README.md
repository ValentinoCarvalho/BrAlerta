# BR ALERTA

**Plataforma colaborativa de inteligência urbana.** O cidadão registra problemas da cidade diretamente no mapa, todos acompanham o andamento e o gestor público atualiza o status de cada ocorrência.

> Projeto acadêmico do Enterprise Challenge, curso de Sistemas de Informação da FIAP. Os dados exibidos são fictícios. A aplicação não tem vínculo oficial com órgãos públicos e não substitui os canais da prefeitura, como a Central 1746 do Rio de Janeiro.

---

## Sumário

- [O problema](#o-problema)
- [A solução](#a-solução)
- [Funcionalidades do MVP](#funcionalidades-do-mvp)
- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Modos de execução](#modos-de-execução)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Banco de dados](#banco-de-dados)
- [Testes e qualidade](#testes-e-qualidade)
- [Roteiro de demonstração](#roteiro-de-demonstração)
- [Limitações e próximos passos](#limitações-e-próximos-passos)
- [Equipe](#equipe)

---

## O problema

Postes apagados, buracos e alagamentos fazem parte do dia a dia das cidades brasileiras. As reclamações existem, mas ficam espalhadas entre telefone, aplicativos de prefeitura, redes sociais e grupos de mensagem. Nas redes, elas se perdem no meio de conteúdos de entretenimento. O resultado é que:

- o cidadão não sabe se o problema já foi relatado nem se alguém está cuidando dele;
- o gestor público não enxerga onde os problemas se repetem nem o que priorizar.

## A solução

O BR ALERTA reúne os relatos em um **mapa único, público e georreferenciado**:

1. O cidadão escolhe a categoria, clica no ponto exato do problema no mapa e descreve o que aconteceu.
2. A ocorrência aparece para todos os usuários, com status e histórico.
3. O gestor público acompanha as ocorrências em um painel administrativo e atualiza o status: **Pendente → Em andamento → Resolvido**.

O protótipo cobre uma região do **Recreio dos Bandeirantes, no Rio de Janeiro**, e duas categorias: **poste apagado** e **buraco na rua**.

## Funcionalidades do MVP

| Funcionalidade | Situação |
| --- | --- |
| Mapa navegável com visão inclinada (3D) e alternância para 2D | Pronto |
| Zoom, rotação, inclinação e botão para voltar à área inicial | Pronto |
| Registro de ocorrência por clique no mapa, com categoria, título, descrição e foto opcional | Pronto |
| Validação do formulário (local, título, descrição, tipo e tamanho da foto) | Pronto |
| Detalhes da ocorrência com histórico de status | Pronto |
| Página "Minhas ocorrências" com filtros por categoria e status | Pronto |
| Painel administrativo com busca, indicadores e atualização de status | Pronto (ver [bugs conhecidos](#bugs-conhecidos)) |
| Login, cadastro e papéis Cidadão/Administrador com Supabase Auth | Pronto (modo Supabase) |
| Atualização em tempo real com Supabase Realtime | Pronto (modo Supabase) |
| Modelos 3D (GLB) e prédios em 3D | Próxima versão |
| Busca por endereço | Simulada |

## Tecnologias

| Categoria | Tecnologias |
| --- | --- |
| Front-end | React, TypeScript, Vite, React Router, CSS próprio, Lucide (ícones) |
| Mapa | MapLibre GL JS com tiles do OpenStreetMap (sem chave privada) |
| Back-end e banco | Supabase (PostgreSQL, Auth, Storage, Realtime, funções RPC e políticas RLS) |
| Testes | Vitest, Testing Library, testes de banco com `supabase test db` |
| Qualidade e CI | ESLint, GitHub Actions (lint, testes, build e testes de RLS) |
| Gestão | Git e GitHub (uma branch por integrante), Kanban |

## Como executar

Requer **Node.js 20 ou superior**.

```bash
git clone https://github.com/rhuanngomes/BrAlerta.git
cd BrAlerta
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`).

Outros comandos:

```bash
npm run build      # gera a versão de produção
npm run preview    # abre a versão de produção localmente
npm run lint       # verifica o padrão do código
npm test           # roda os testes automatizados
npm run test:db    # roda os testes de banco e RLS (requer Supabase local)
```

## Modos de execução

### 1. Modo demonstração (padrão)

Não precisa de banco nem de conta. Os dados ficam no `localStorage` do navegador e começam com 10 ocorrências fictícias (`src/data/seed.ts`).

Para voltar aos dados iniciais, apague a chave `br-alerta-incidents-v1` no armazenamento local do navegador (DevTools → Application → Local Storage).

### 2. Modo Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. Aplique as migrações da pasta `supabase/migrations`, em ordem.
3. Copie `.env.example` para `.env` e preencha:

```env
VITE_USE_SUPABASE=true
VITE_ENABLE_REALTIME=true
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

4. Rode `npm run dev`, crie uma conta e confirme o e-mail.
5. Para ter dados de demonstração, rode `supabase/seed.sql` no SQL Editor (12 ocorrências fictícias com histórico).
6. Para tornar um usuário administrador, rode no SQL Editor:

```sql
update public.profiles
set role = 'ADMIN', updated_at = now()
where email = 'email-do-administrador@exemplo.com';
```

Novas contas sempre começam como `CITIZEN`. A promoção para `ADMIN` nunca é feita pela interface, e as políticas RLS garantem a autorização mesmo que alguém tente usar a API diretamente.

## Estrutura do projeto

```
src/
├── components/     # layout, mapa, formulário, detalhes, indicadores e rotas protegidas
├── context/        # estado de autenticação e de ocorrências
├── data/           # ocorrências fictícias do modo demonstração
├── lib/            # cliente Supabase, tipos do banco e tratamento de erros
├── pages/          # mapa, minhas ocorrências, painel admin, sobre, login e cadastro
├── repositories/   # contrato IncidentRepository + versões mock e Supabase
├── services/       # escolhe o repositório conforme o modo de execução
└── types/          # tipos de ocorrência, categoria, status e histórico
supabase/
├── migrations/     # tabelas, índices, perfis, RLS, storage e funções RPC
├── tests/          # testes das políticas de segurança
└── seed.sql        # ocorrências fictícias para o modo Supabase
tests/              # testes automatizados do front-end e dos repositórios
```

## Banco de dados

| Tabela | Conteúdo |
| --- | --- |
| `incidents` | Ocorrência: categoria, título, descrição, latitude, longitude, endereço, status, foto e datas |
| `scene_objects` | Objeto que representa a ocorrência no mapa: tipo, posição, altitude, rotação e escala |
| `incident_history` | Cada mudança de status, com quem mudou e quando |
| `profiles` | Nome, e-mail e papel do usuário (`CITIZEN` ou `ADMIN`) |

Regras principais:

- qualquer usuário logado vê as ocorrências;
- o cidadão só cria ocorrências em seu próprio nome;
- só administradores mudam o status, sempre pela função `update_incident_status`, que grava o histórico na mesma transação.

## Testes e qualidade

**Testes automatizados** (`npm test`): formulário de ocorrência, repositório mock, repositório Supabase, conversão de dados e tratamento de erros de integração. A cada push ou pull request na `main`, o GitHub Actions roda lint, testes, build e os testes de RLS do banco.

**Testes manuais**: o plano de testes, com 20 casos (CT01 a CT20) e os resultados, está na documentação de qualidade do projeto. Para relatar um erro, abra uma issue com o modelo **Relatar bug**.

### Bugs conhecidos

Encontrados na revisão de qualidade e registrados para correção:

| ID | Gravidade | Descrição |
| --- | --- | --- |
| BUG-01 | Alta | No modo demonstração, o perfil é sempre Cidadão, então o painel administrativo não aparece no menu e `/admin` volta para o mapa. |
| BUG-02 | Média | No modo demonstração, o botão Sair gera erro, porque tenta usar o Supabase, que não está configurado. |
| BUG-03 | Média | O marcador de prévia continua no mapa depois de publicar ou cancelar uma ocorrência. |
| BUG-04 | Média | A prévia no mapa sempre mostra o ícone de poste, mesmo quando a categoria escolhida é buraco. |
| BUG-05 | Baixa | A coluna Localização do painel e o endereço do formulário são fixos ("Recreio, RJ"). |
| BUG-06 | Baixa | Ao alternar entre Mapa 2D e 3D, a câmera volta para a última ocorrência aberta. |
| BUG-07 | Baixa | A busca do topo usa um alerta do navegador e o sino de notificações ainda não tem função. |
| BUG-08 | Baixa | A página Sobre cita "Global Solution", mas o projeto é do Enterprise Challenge. |

## Roteiro de demonstração

1. Abrir o mapa e mostrar as ocorrências fictícias, alternando entre 3D e 2D.
2. Clicar em uma ocorrência e mostrar os detalhes e o histórico.
3. Clicar em **Registrar ocorrência**, escolher a categoria, clicar na rua e publicar.
4. Abrir **Minhas ocorrências** e filtrar por status.
5. Entrar como administrador, abrir o **Painel administrativo**, buscar a ocorrência criada e mudar o status para **Em andamento**.
6. Voltar ao mapa e mostrar o novo status no histórico.

> No modo demonstração, o passo 5 depende da correção do BUG-01. Para a apresentação, use o modo Supabase com um usuário administrador.

## Limitações e próximos passos

- **3D:** a versão atual usa o mapa inclinado com marcadores. Não há modelos GLB/GLTF nem prédios em 3D, porque os tiles raster do OpenStreetMap não trazem altura dos edifícios. O próximo passo é usar uma fonte vetorial com alturas e integrar Three.js com modelos otimizados.
- **Busca por endereço:** ainda simulada.
- **Fotos no modo demonstração:** ficam no navegador e não são enviadas a nenhum servidor.
- **Próximas versões:** novas categorias (alagamento e segurança), confirmação "eu também vi", IA para classificar e agrupar relatos, aplicativo móvel e integração com prefeituras e concessionárias.

## Equipe

| Integrante | Frente |
| --- | --- |
| Rhuann | Back-end e integração |
| Valentino | Mapa e interação 3D |
| Léo | Front-end e telas |
| Enzo | Design e assets 3D |
| Gabriela | Pesquisa, qualidade e apresentação |
