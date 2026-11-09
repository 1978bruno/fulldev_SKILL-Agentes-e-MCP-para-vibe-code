# Plano da F02-T02: Abrir um Canal criado por comando e enviar uma Mensagem

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste de integração

**Cenário:** Dado o banco de testes com as migrações, quando o comando de canais cria um Canal e a
API grava Mensagens, então as tabelas `conversations`, `conversation_members` e `messages` existem
com as unicidades, os índices e os `CHECK` do contrato. O nome repetido é recusado pelo índice
único, e uma Mensagem de 4001 caracteres é recusada pelo `CHECK`.

**Teste previsto:** integração, `src/conversations/conversations.int-spec.ts`, "o banco recusa um
Canal com nome repetido" e "o banco recusa uma Mensagem acima do limite". A forma das tabelas é
conferida na migração, no fim da tarefa.

### CA2

**Marca:** teste de integração e teste de unidade

**Cenário:** Dado Pessoas no banco, quando quem opera roda `create` com um nome válido e um Tópico,
então o Canal existe com a participação de todas as Pessoas. Dado um nome inválido ou repetido,
então o comando sai com 1 e a mensagem, sem gravar nada. A regra do nome tem muitos casos e é uma
função pura.

**Teste previsto:**
- integração, `src/channels/channels.command.int-spec.ts`, "create grava o Canal com todas as
  Pessoas como Membros", "create recusa nome repetido" e "create recusa nome inválido";
- unidade, `src/conversations/channel-name.spec.ts`, os casos da regra do nome e do Tópico
  (tamanho, minúsculas, acentos, `-` e `_`, espaços, `#`, NFC; Tópico com quebra de linha e acima
  de 250).

### CA3

**Marca:** teste HTTP

**Cenário:** Dado um Canal e uma Pessoa sem participação nele (a participação é apagada no
Arrange), quando ela pede a Conversa ou as Mensagens, então recebe 404 `conversation_not_found`,
com o mesmo corpo de um id inexistente e de um id malformado.

**Teste previsto:** e2e da API, `test/conversations.e2e-spec.ts`, "responde 404 para id
inexistente, id malformado e Pessoa sem participação, com o mesmo corpo", e
`test/messages.e2e-spec.ts`, "responde 404 nas Mensagens de uma Conversa sem participação".

### CA4

**Marca:** teste HTTP

**Cenário:** Dado dois Canais de que a Pessoa é Membro e um de que não é, quando ela lista as
Conversas, então recebe só os dois, em ordem alfabética. Quando pede um deles, recebe a Conversa
com `id`, `kind`, `name` e `topic`.

**Teste previsto:** e2e da API, `test/conversations.e2e-spec.ts`, "lista só as Conversas de que a
Pessoa é Membro, em ordem alfabética" e "responde 200 com a Conversa para um Membro".

### CA5

**Marca:** teste HTTP

**Cenário:** Dado um Canal com mais Mensagens que o `tamanho da página`, quando a Pessoa pede as
Mensagens sem `before`, então recebe as mais recentes, em ordem cronológica, com o autor e
`has_more` verdadeiro. Quando envia uma Mensagem com espaços nas pontas, recebe 201 com o texto sem
as pontas e ela mesma como autora. Sem Sessão, as quatro rotas respondem 401.

**Teste previsto:** e2e da API, `test/messages.e2e-spec.ts`, "devolve a página mais recente em
ordem cronológica, com has_more", "responde 201 e grava a Mensagem com a Pessoa da Sessão como
autora", "remove os espaços das pontas", "recusa texto vazio com validation_failed" e
`test/conversations.e2e-spec.ts` e `test/messages.e2e-spec.ts`, "responde 401 sem Sessão".

### CA6

**Marca:** revisão humana

**Cenário:** Dado o diff, quem revisa encontra as quatro rotas no service HTTP do web, com o retorno
em união discriminada, as iniciais do autor calculadas no service e a leitura da Pessoa da Sessão
memorizada por requisição (`cache` do React) e usada pelo layout e pela página da Conversa.

### CA7

**Marca:** teste no Playwright

**Cenário:** Dado uma Pessoa Membro de dois Canais, quando ela abre a Home, então a barra lateral
mostra a seção "Canais" com os dois em ordem alfabética, e ela abre um pelo clique e o outro pelo
teclado (Tab até o link e Enter). A barra lateral não tem "Adicionar canal", Mensagens diretas nem
Agentes.

**Teste previsto:** Playwright, `e2e/conversa/abrir-canal-pela-barra-lateral.spec.ts` e
`e2e/conversa/abrir-canal-pelo-teclado.spec.ts`.

### CA8

**Marca:** teste no Playwright

**Cenário:** Dado um Canal com Tópico e Mensagens, quando a Pessoa o abre, então vê o cabeçalho com
`#`, nome e Tópico, as Mensagens com avatar, nome, hora e texto, a última visível acima da caixa e
o foco na caixa. Dado um endereço de Conversa que não existe, então vê "Conversa não encontrada"
com "Voltar ao início".

**Teste previsto:** Playwright, `e2e/conversa/ler-as-mensagens-recentes.spec.ts` e
`e2e/conversa/conversa-nao-encontrada.spec.ts`.

### CA9

**Marca:** revisão humana

**Cenário:** Dado o diff, quem revisa encontra o histórico no `useSWRInfinite`, com a primeira
página do Server Component como `fallbackData`, `pages[0]` como a página mais recente, só Mensagens
gravadas no cache e uma função que achata as páginas numa lista cronológica para a renderização.

### CA10

**Marca:** teste no Playwright

**Cenário:** Dado um Canal aberto, quando a Pessoa escreve uma linha, aperta Shift+Enter, escreve
outra e aperta Enter, então a Mensagem aparece no fim da lista com as duas linhas, a caixa fica
vazia, e a Mensagem continua lá depois de recarregar a página.

**Teste previsto:** Playwright, `e2e/conversa/enviar-mensagem.spec.ts`.

### CA11

**Marca:** teste no Playwright

**Cenário:** Dado uma Pessoa com Canais, quando abre a Home, então vai para o primeiro Canal da
lista; sem Canais, vê "Nenhuma conversa ainda". Dado o endereço de um Canal aberto sem Sessão,
então ela vai para "Entrar" e, depois de entrar, cai no Canal. Quando troca de Canal e usa voltar e
avançar do navegador, então o Canal da tela acompanha. Um 401 no envio leva a "Entrar".

**Teste previsto:** Playwright, `e2e/conversa/home-abre-o-primeiro-canal.spec.ts`,
`e2e/conversa/entrar-pelo-endereco-do-canal.spec.ts`, `e2e/conversa/voltar-e-avancar.spec.ts` e
`e2e/conversa/envio-com-sessao-revogada.spec.ts`. A Home vazia segue provada pelo teste da F01
`e2e/login/entrar-ate-a-home.spec.ts`, porque a Pessoa da fixture não é Membro de nenhum Canal.

### CA12

**Marca:** teste HTTP e teste de integração

**Cenário:** Os testes de CA1 a CA5, com a base da spec: `uniqueChannelName()`, o atalho de Canal
pelo service e o de Mensagens direto no banco, com o `id` UUID v7 gerado na hora pedida.

**Teste previsto:** os de CA1 a CA5.

### CA13

**Marca:** teste no Playwright

**Cenário:** Os testes de CA7, CA8, CA10 e CA11, com as fixtures `channel` e de Mensagens, o plano
de testes da F02 e a checagem com `@axe-core/playwright` na Conversa, sem violações.

**Teste previsto:** os de CA7, CA8, CA10 e CA11, e `e2e/acessibilidade/conversa-sem-violacoes.spec.ts`.

### CA14

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quem revisa encontra `validacao-visual.md`, com as capturas
da Conversa (21:2843) e da barra lateral em 1440 × 900, nos dois temas, ao lado das capturas dos
frames do Figma.

## Contrato

### conversations · chat · nova

| Coluna | Tipo | Nulo | Padrão | Observação |
| --- | --- | --- | --- | --- |
| `id` | uuid | não | — | UUID v7, gerado na aplicação |
| `kind` | text | não | — | `CHECK (kind IN ('public_channel'))`, escrito à mão na migração |
| `name` | text | sim | — | Obrigatório em Canal; `CHECK (char_length(name) BETWEEN 1 AND 80)`, à mão |
| `topic` | text | sim | — | `CHECK (char_length(topic) <= 250)`, à mão |
| `created_at`, `updated_at` | timestamptz | não | `now()` | |

- Chave primária `id`.
- Índice único parcial `conversations_name_key` em `name` `WHERE name IS NOT NULL`, à mão.
- `CHECK (kind <> 'public_channel' OR name IS NOT NULL)`, à mão.

### conversation_members · chat · nova

| Coluna | Tipo | Nulo | Padrão | Observação |
| --- | --- | --- | --- | --- |
| `id` | uuid | não | — | UUID v7 |
| `conversation_id` | uuid | não | — | FK `conversations(id)` `ON DELETE CASCADE` |
| `person_id` | uuid | não | — | FK `people(id)` `ON DELETE CASCADE` |
| `created_at`, `updated_at` | timestamptz | não | `now()` | |

- Única em (`conversation_id`, `person_id`); índice em `person_id`.

### messages · chat · nova

| Coluna | Tipo | Nulo | Padrão | Observação |
| --- | --- | --- | --- | --- |
| `id` | uuid | não | — | UUID v7; dá a ordem da Conversa |
| `conversation_id` | uuid | não | — | FK `conversations(id)` `ON DELETE CASCADE` |
| `author_id` | uuid | não | — | FK `people(id)`, sem ação na exclusão |
| `client_id` | uuid | não | — | Identificador gerado no cliente |
| `body` | text | não | — | `CHECK (char_length(body) BETWEEN 1 AND 4000)`, à mão |
| `created_at`, `updated_at` | timestamptz | não | `now()` | |

- Índice em (`conversation_id`, `id`); única em (`author_id`, `client_id`).

### GET /v1/conversations · nova

| Item | Descrição |
| --- | --- |
| Autenticação | Cookie de sessão (guard da F01) |
| Resposta de sucesso | 200 `{ conversations: [{ id, kind, name, topic }] }`, em ordem alfabética do nome |
| Erros | 401 `unauthenticated` |

### GET /v1/conversations/:id · nova

| Item | Descrição |
| --- | --- |
| Autenticação | Cookie de sessão |
| Parâmetros de caminho | `id`, texto; um valor que não é uuid é tratado como inexistente |
| Resposta de sucesso | 200 `{ conversation: { id, kind, name, topic } }` |
| Erros | 401 `unauthenticated`; 404 `conversation_not_found` |

### GET /v1/conversations/:id/messages · nova

| Item | Descrição |
| --- | --- |
| Autenticação | Cookie de sessão |
| Parâmetros de caminho | `id`, como acima |
| Parâmetros de consulta | Nenhum nesta tarefa; `before` e `limit` entram na F02-T03 |
| Resposta de sucesso | 200 `{ messages: [Mensagem], has_more }`, a página mais recente, do `tamanho da página` padrão, em ordem cronológica |
| Erros | 401 `unauthenticated`; 404 `conversation_not_found` |

Mensagem: `{ id, conversation_id, client_id, author: { id, name }, body, created_at }`.

### POST /v1/conversations/:id/messages · nova

| Item | Descrição |
| --- | --- |
| Autenticação | Cookie de sessão |
| Parâmetros de caminho | `id`, como acima |
| Corpo da requisição | `client_id` (uuid, obrigatório), `body` (texto, obrigatório) |
| Resposta de sucesso | 201 `{ message: Mensagem }` |
| Erros | 400 `validation_failed` (sem `client_id` uuid, texto vazio depois de remover as pontas, acima do `tamanho máximo da Mensagem`); 401 `unauthenticated`; 404 `conversation_not_found` |

### Server Action sendMessage (BFF) · nova

| Item | Descrição |
| --- | --- |
| Autenticação | Cookie de sessão, repassado à API |
| Entrada | `conversationId`, `clientId`, `body` |
| Chama | `POST /v1/conversations/:id/messages` |
| Resposta | `{ kind: "ok", message }`, `{ kind: "invalid" }`, `{ kind: "not_found" }`, `{ kind: "unauthenticated" }` ou `{ kind: "failure" }`; a Mensagem já com as iniciais do autor |

## Verificação do contrato

- `conversations`: o índice único do nome e o `CHECK` do Tópico: CA1 e CA2.
- `conversation_members`: a única em (`conversation_id`, `person_id`): CA2 (o `create` grava uma
  linha por Pessoa).
- `messages`: o `CHECK` do texto: CA1; a única em (`author_id`, `client_id`): provada na F02-T05,
  que entrega o envio repetido.
- `GET /v1/conversations`: 200 em CA4; 401 em CA5.
- `GET /v1/conversations/:id`: 200 em CA4; 404 em CA3; 401 em CA5.
- `GET /v1/conversations/:id/messages`: 200 em CA5; 404 em CA3; 401 em CA5.
- `POST /v1/conversations/:id/messages`: 201 e 400 em CA5; 404 em CA3; 401 em CA5.
- Server Action: `ok` em CA10; `unauthenticated` em CA11.

## Decisões

- **Autor das Mensagens:** o service de Mensagens busca os nomes pelo `PeopleService` (uma consulta
  pelos ids da página), em vez de uma relação do TypeORM com a entidade de Pessoas, para não
  importar tipo interno de outro módulo (`AGENTS.md` da API, "A camada de serviços").
- **Validação do texto:** o DTO remove as pontas e valida o tamanho em pontos de código por um
  validador próprio; o `CHECK` do banco é a mesma regra, como última barreira.
- **Id malformado:** o service de Conversas confere o formato do uuid antes de consultar e lança
  `conversation_not_found`, para o Postgres não responder erro de sintaxe.
- **Trava de participação:** `pg_advisory_xact_lock` com uma constante exportada pelo módulo de
  Conversas, que o `create` de contas (F02-T09) usa.
- **Envio repetido:** nesta tarefa, um `client_id` repetido do mesmo autor bate na única e sobe como
  erro inesperado. A tolerância é da F02-T05.
- **Cache do histórico:** `pages[0]` é a página mais recente, e as anteriores entram depois dela
  (F02-T03). A Mensagem gravada pelo envio entra no fim de `pages[0]`. A renderização recebe a
  lista cronológica de uma função pura (`flattenPages`).
- **Falha nesta tarefa:** a falha da lista de Conversas deixa a seção "Canais" vazia, e a falha da
  Conversa ou da primeira página mostra o erro padrão do Next. As telas certas são da F02-T06 e da
  F02-T07. A falha no envio deixa o texto na caixa; os estados "enviando" e "falhou" são da
  F02-T05.
- **Hora:** formatada com o `fuso padrão` do LLD, igual no servidor e no cliente, até a F02-T04.
- **Fixture de Mensagens da web e atalho da API:** geram o `id` UUID v7 a partir do instante pedido,
  por uma função pequena da base de testes de cada projeto.

## Arquivos e interfaces

API (`apps/chat-api`):
- `migrations/<timestamp>-CreateConversationsAndMessages.ts`: as três tabelas.
- `src/conversations/`: `conversation.entity.ts`, `conversation-member.entity.ts`,
  `conversations.service.ts` (`listForMember`, `getForMember`, `createPublicChannel`),
  `conversations.controller.ts`, `conversations.module.ts`, `channel-name.ts` (`parseChannelName`,
  `parseTopic`), `conversation-not-found.error.ts`, `conversation.response.ts`,
  `public-membership-lock.ts`.
- `src/messages/`: `message.entity.ts`, `messages.service.ts` (`listLatest`, `send`),
  `messages.controller.ts`, `messages.module.ts`, `send-message.dto.ts`, `message.response.ts`.
- `src/people/people.service.ts`: `listIds()` e `findByIds(ids)`.
- `src/common/validation/max-code-points.ts`: o validador de tamanho em pontos de código.
- `src/common/errors/`: `conversation_not_found` no `ErrorCode`, no mapa de status e no de `detail`.
- `src/channels/`: `cli.ts`, `channels.command.ts`, `channels.module.ts`; script `channels` no
  `package.json`.
- `src/app.module.ts`: os módulos de Conversas e de Mensagens.
- `test/support/`: `unique-channel-name.ts`, `uuid-v7-at.ts`, `conversation-routes.ts`.
- `AGENTS.md`: `pnpm channels create` em "Comandos".

Web (`apps/web`):
- `package.json`: `swr`.
- `src/app/services/chat-api.ts`: `Conversation`, `Message`, `listConversations`,
  `getConversation`, `listLatestMessages`, `sendMessage`; `getCurrentPerson` com `cache`.
- `src/app/actions/send-message.ts`: o Server Action.
- `src/app/(app)/page.tsx`: o redirecionamento ao primeiro Canal.
- `src/app/(app)/conversas/[id]/page.tsx` e `not-found.tsx`.
- `src/app/components/workspace-nav/`: `sidebar.tsx` (com a lista), `sidebar-section.tsx`,
  `sidebar-row.tsx`.
- `src/app/components/conversation/`: `conversation-header.tsx`, `message-list.tsx`,
  `message-composer.tsx`.
- `src/app/components/message/message-item.tsx`.
- `src/app/components/ui/`: `icon-button.tsx`, `textarea.tsx`.
- `src/app/hooks/use-message-history.ts`: o `useSWRInfinite`.
- `src/app/utils/message-pages.ts`: `flattenPages`, com teste no Vitest.
- `src/app/utils/format-time.ts`: a hora no `fuso padrão`.
- `e2e/support/database.ts`: `insertChannel`, `insertMessages`; `e2e/fixtures.ts`: `channel`.
- `e2e/plano-de-testes-f02.md` e os testes de `e2e/conversa/`.

## Testes existentes que mudam

Nenhum. O teste da F01 `entrar-ate-a-home` continua vendo a Home vazia, porque a Pessoa da fixture
não é Membro de nenhum Canal.

## Mudança de dados

Nenhuma. Os Canais de desenvolvimento são criados pelo comando.

## Documentos atualizados

Nenhum: o LLD já registra as rotas, as tabelas e as regras que esta tarefa entrega.
