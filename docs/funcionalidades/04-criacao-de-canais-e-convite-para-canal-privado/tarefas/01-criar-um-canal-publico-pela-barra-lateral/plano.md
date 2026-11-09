# Plano da F04-T01: Criar um Canal público pela barra lateral

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** documento

**Cenário:** Quem revisa abre a seção "Diálogos da casca" do Figma e encontra, nos frames "Diálogos /
Criar canal / Padrão", "Erro no nome" e "Enviando", o rótulo "Tópico (opcional)" no lugar de
"Descrição (opcional)", e o frame novo "Diálogos / Criar canal / Falha ao criar", com o nome e o
Tópico preenchidos e a mensagem "Não foi possível criar o canal. Tente de novo." acima dos botões.

### CA2

**Marca:** teste HTTP

**Cenário:** Dado o banco de testes migrado, quando dois pedidos de criação chegam com o mesmo
`client_id` da mesma Pessoa, então só uma linha existe, porque a unicidade parcial em
(`created_by`, `client_id`) é do banco. Os Canais do comando, sem `created_by` nem `client_id`,
continuam valendo.

**Teste previsto:** e2e da API, `test/conversations-create.e2e-spec.ts`, "o reenvio com o mesmo
client_id devolve o mesmo Canal, mesmo com outro nome" (confere a contagem de linhas) e o teste do
comando de canais, que já existe, sem mudança.

### CA3

**Marca:** teste HTTP

**Cenário:**
- Dada uma Pessoa com Sessão, quando ela cria um Canal público com nome e Tópico válidos, então
  recebe 201 com a Conversa, `created_by` é ela, e todas as Pessoas são Membros.
- Quando ela repete o pedido com o mesmo `client_id`, mesmo com outro nome, recebe 201 com o mesmo
  Canal, e nada é gravado.
- Quando o nome já existe, recebe `channel_name_taken` (409), com o nome normalizado no `detail`.
- Quando o nome ou o Tópico estão fora da regra, ou o `kind` não é `public_channel`, ou o
  `client_id` não é uuid, recebe `validation_failed` (400).
- Sem Sessão, recebe 401.

**Teste previsto:** e2e da API, `test/conversations-create.e2e-spec.ts`: "cria o Canal público com
todas as Pessoas como Membros", "o reenvio com o mesmo client_id devolve o mesmo Canal, mesmo com
outro nome", "nome repetido responde 409 com o nome no detail", "nome, Tópico, kind e client_id
fora da regra respondem 400", "responde 401 sem Sessão".

### CA4

**Marca:** teste HTTP e teste de unidade

**Cenário:**
- Dada uma Conversa com três Membros, quando um deles a lê pela lista, pela rota da Conversa ou
  pela criação, então ela vem com `member_count` 3.
- Dados Canais chamados `zebra`, `árvore`, `Ábaco` (gravado direto, para o caso de maiúscula),
  `abelha` e `b`, quando a Pessoa lista as Conversas, então elas vêm em `abelha`, `Ábaco`,
  `árvore`, `b`, `zebra`: a ordem do `Intl.Collator('pt-BR')`, e não a do banco.
- A função pura de ordem, na API e na web, põe acentos e maiúsculas junto da letra base.

**Teste previsto:** e2e da API, `test/conversations.e2e-spec.ts`, "lista em ordem alfabética do
pt-BR" e "a Conversa traz a quantidade de Membros"; unidade, `src/conversations/name-order.spec.ts`;
Vitest, `src/app/utils/name-order.test.ts`.

### CA5

**Marca:** teste no Playwright

**Cenário:** Dado o diálogo aberto, quando a Pessoa cria o Canal, falha por rede e tenta de novo,
então a nova tentativa leva o mesmo `client_id` e grava um Canal só. Sem Sessão, a criação leva a
"Entrar" pelo `GET /api/session/expired`.

**Teste previsto:** Playwright, `e2e/canais-publicos/falha-ao-criar.spec.ts`, "a falha mantém o
que foi preenchido e a nova tentativa cria um Canal só", que conta as linhas pelo nome. O
Server Action valida o nome e o Tópico pela mesma função da tela (CA6), provada pelo Vitest.

### CA6

**Marca:** teste no Playwright e teste de unidade

**Cenário:**
- Dada a barra lateral, quando a Pessoa ativa "Adicionar canal" pelo teclado, então abre o diálogo
  "Criar canal", com o foco no nome.
- Quando ela digita `Planejamento Q4!`, então o campo mostra `planejamento-q4`.
- Quando ela confirma, então o botão mostra o estado "Enviando", o diálogo fecha, a Conversa
  `/conversas/<id>` abre com "Este é o começo do canal #planejamento-q4…" e o Tópico, o foco vai
  para a caixa de mensagem e o Canal aparece na barra lateral.
- Esc fecha o diálogo sem criar nada e devolve o foco a "Adicionar canal".
- A função pura do nome: NFC, minúsculas, espaço vira `-`, caracteres fora da regra não entram,
  corte em 80 pontos de código; a do Tópico corta em 250 e tira quebras de linha.

**Teste previsto:** Playwright, `e2e/canais-publicos/criar-canal-publico.spec.ts`, "cria o Canal
pelo teclado e cai nele", "Esc fecha sem criar"; Vitest, `src/app/utils/channel-name.test.ts`.

### CA7

**Marca:** teste HTTP e teste de unidade

**Cenário:** Os testes de CA2, CA3 e CA4 provam, na API, a criação com todas as Pessoas, o reenvio
idempotente, o nome repetido, o nome e o Tópico inválidos, o `member_count`, a ordem com acentos e
o 401; a unidade, a ordem; o Vitest, a normalização do nome.

**Teste previsto:** os de CA2, CA3, CA4 e CA6.

### CA8

**Marca:** teste no Playwright

**Cenário:**
- Dado um Canal que já existe, quando a Pessoa tenta criar outro com o mesmo nome, então o campo
  mostra "Já existe um canal chamado #nome." e o diálogo continua aberto.
- Dada a criação abortada pelo `page.route`, então o diálogo mostra "Não foi possível criar o
  canal. Tente de novo." com o nome e o Tópico preenchidos.
- A checagem com `@axe-core/playwright` no diálogo aberto, com o erro no nome, não acha violações.

**Teste previsto:** Playwright, `e2e/canais-publicos/criar-canal-publico.spec.ts`, "o nome
repetido aparece no campo"; `e2e/canais-publicos/falha-ao-criar.spec.ts` (o de CA5);
`e2e/canais-publicos/criar-canal-sem-violacoes.spec.ts`.

### CA9

**Marca:** documento

**Cenário:** Quem revisa encontra nesta pasta `validacao-visual.md`, com as capturas do diálogo em
1440 × 900 nos temas claro e escuro, nos estados Padrão, Erro no nome, Enviando e Falha ao criar,
comparadas com o `get_screenshot` dos frames, e as diferenças anotadas. O Switch "Tornar privado"
fica de fora nesta tarefa e entra na 02.

## Contrato

### POST /v1/conversations · nova

| Item | O que descreve |
| --- | --- |
| Autenticação | Sessão, pelo cookie (guard da F01) |
| Corpo da requisição | `kind` (texto, obrigatório; nesta tarefa só `public_channel`), `name` (texto, obrigatório; regra do nome da F02), `topic` (texto, opcional; regra do Tópico da F02), `client_id` (uuid, obrigatório) |
| Resposta de sucesso | 201 com `conversation`: `id`, `kind`, `name`, `topic`, `member_count`. O mesmo 201, com o Canal já criado, no reenvio do mesmo `client_id` |
| Erros | 400 `validation_failed`; 401 `unauthenticated`; 409 `channel_name_taken`, com o nome normalizado no `detail` |

### GET /v1/conversations · alterada

| Item | Antes | Depois |
| --- | --- | --- |
| Resposta de sucesso | Cada Conversa com `id`, `kind`, `name`, `topic`, em ordem alfabética do banco | Cada Conversa também com `member_count`, em ordem do `Intl.Collator('pt-BR')` |

### GET /v1/conversations/:id · alterada

| Item | Antes | Depois |
| --- | --- | --- |
| Resposta de sucesso | `conversation` com `id`, `kind`, `name`, `topic` | `conversation` também com `member_count` |

### Server Action `createChannel` · nova

| Item | O que descreve |
| --- | --- |
| Autenticação | O cookie de sessão, repassado à API (LLD, "Interfaces") |
| Entrada | `name`, `topic`, `clientId` (uuid) |
| Rota da API | `POST /v1/conversations`, com `kind` `public_channel` |
| Resposta | `{ kind: "ok", conversation }`, `{ kind: "name_taken" }`, `{ kind: "invalid" }`, `{ kind: "unauthenticated" }` ou `{ kind: "failure" }` |

### conversations · chat · alterada

- `created_by`: uuid, aceita nulo, sem padrão. Chave estrangeira para `people(id)`, `ON DELETE SET
  NULL`. Quem criou o Canal pelo produto; os do comando ficam nulos.
- `client_id`: uuid, aceita nulo, sem padrão. Identificador gerado no cliente.
- Índice único parcial `conversations_creator_client_key` em (`created_by`, `client_id`) onde os
  dois não são nulos.

## Verificação do contrato

- `POST /v1/conversations` 201, criação e reenvio: CA3 e CA2.
- `POST /v1/conversations` 400, 401 e 409: CA3.
- `GET /v1/conversations` com `member_count` e a ordem nova: CA4.
- `GET /v1/conversations/:id` com `member_count`: CA4.
- Server Action `createChannel`, `ok`, `name_taken` e `failure`: CA6, CA8 e CA5. `invalid` só
  acontece com uma chamada que passa por fora da tela, que normaliza antes; não tem teste próprio.
- Unicidade parcial em (`created_by`, `client_id`): CA2.

## Decisões

- O service ganha `createChannel(creatorId, { kind, name, topic, clientId })`, que devolve a Conversa
  e se ela foi criada agora. O `createPublicChannel` do comando passa a usar o mesmo núcleo, sem
  criador nem `client_id`: uma regra de nome, de trava e de participação só.
- O reenvio é conferido dentro da trava, antes do nome, como na spec. A unicidade do banco é a
  garantia; a conferência só evita a exceção de violação.
- `member_count` sai de uma consulta agrupada pelos ids das Conversas lidas, e não de uma junção na
  leitura da lista: a lista continua sendo a consulta da F02, e a contagem é uma segunda consulta.
- A ordem é a função pura `compareConversationNames`, com `Intl.Collator('pt-BR', { sensitivity:
  'base' })` e, no empate, a comparação simples, para a ordem ser estável. A API e a web têm cada
  uma a sua cópia, com os mesmos casos de teste.
- `ChannelNameTakenError` passa a dizer "Já existe um canal chamado #nome.", a frase do PRD, e o
  `DETAILS` do filter fica como está (é o texto de quando não há erro de domínio).
- O diálogo fica fora do Server Component da barra lateral, num componente cliente
  `AddChannelAction` (SidebarAction "Adicionar canal") com o `CreateChannelDialog`. Depois de criar,
  o cliente faz `router.push` para a Conversa e `router.refresh`, para a barra lateral, ainda
  renderizada no servidor, mostrar o Canal; a 03 troca isso pelo cache do cliente.
- O `client_id` nasce quando o diálogo abre e vale até ele fechar: a nova tentativa depois de uma
  falha leva o mesmo.
- O botão "Criar canal" fica desabilitado com o nome vazio. Enter no nome ou no Tópico confirma.
- O Switch "Tornar privado" não entra nesta tarefa, porque só existe Canal público; a 02 o põe.
- Os testes do Playwright que criam Canal público pela tela incluem todas as Pessoas do banco de
  desenvolvimento, e por isso quebrariam os testes que contam com uma Pessoa fora de qualquer Canal
  (Home vazia, primeiro Canal da lista). Eles ficam na pasta `e2e/canais-publicos/`, num projeto do
  Playwright que depende do projeto principal e roda depois dele, um teste por vez, e cada teste
  apaga no fim os Canais que criou.

## Arquivos e interfaces

- `apps/chat-api/src/conversations/conversation.entity.ts`: colunas `createdBy` e `clientId` e o
  índice parcial.
- `apps/chat-api/migrations/<timestamp>-AddConversationCreator.ts`: a migração das duas colunas, da
  chave estrangeira e do índice.
- `apps/chat-api/src/conversations/conversations.service.ts`: `createChannel`, `countMembers`,
  `listForMember` e `getForMember` com a contagem e a ordem nova.
- `apps/chat-api/src/conversations/name-order.ts`: `compareConversationNames`.
- `apps/chat-api/src/conversations/create-conversation.dto.ts`: validação do corpo.
- `apps/chat-api/src/conversations/conversation.response.ts`: `member_count`.
- `apps/chat-api/src/conversations/conversations.controller.ts`: `POST /v1/conversations`.
- `apps/chat-api/src/conversations/channel-name-taken.error.ts`: a frase do PRD.
- `apps/web/src/app/services/chat-api.ts`: `createChannel`, `Conversation.memberCount`.
- `apps/web/src/app/actions/create-channel.ts`: o Server Action.
- `apps/web/src/app/utils/channel-name.ts`: `normalizeChannelNameInput`, `normalizeTopicInput`,
  `isValidChannelName`.
- `apps/web/src/app/utils/name-order.ts`: `compareConversationNames`.
- `apps/web/src/app/components/ui/dialog.tsx`: o Dialog do design system (Radix).
- `apps/web/src/app/components/workspace-nav/add-channel-action.tsx` e
  `apps/web/src/app/components/workspace-nav/create-channel-dialog.tsx`: a SidebarAction e o
  diálogo.
- `apps/web/src/app/components/workspace-nav/sidebar.tsx`: a ação no fim da seção "Canais".
- `apps/web/playwright.config.ts`: o projeto `canais-publicos`.
- `apps/web/e2e/support/database.ts`: apagar Canais pelo nome e contar Canais pelo nome.

## Testes existentes que mudam

- `apps/chat-api/test/conversations.e2e-spec.ts`: as respostas da Conversa ganham `member_count`, e
  o teste de ordem passa a ter nomes com acento.
- `apps/chat-api/src/conversations/*.int-spec.ts` do comando de canais: a frase do nome repetido
  muda.

## Mudança de dados

Nenhuma. As linhas que já existem ficam com `created_by` e `client_id` nulos.

## Documentos atualizados

Nenhum. O LLD e a spec já registram a criação sem duplicar, a rota e o `member_count`; a tarefa só
os implementa.
