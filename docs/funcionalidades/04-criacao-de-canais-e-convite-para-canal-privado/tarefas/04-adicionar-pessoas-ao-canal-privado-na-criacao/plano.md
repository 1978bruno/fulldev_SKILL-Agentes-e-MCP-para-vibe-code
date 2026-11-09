# Plano da F04-T04: Adicionar Pessoas ao Canal privado na criação

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** documento

**Cenário:** Quem revisa abre a seção "Diálogos da casca" do Figma e encontra os frames "Diálogos /
Adicionar pessoas / Escolhidas", "Ninguém encontrado", "Enviando" e "Falha ao adicionar". Eles
seguem o padrão de busca e PersonRow de "Diálogos / Nova conversa", com:
- o título "Adicionar pessoas ao #nome";
- as escolhidas acima dos resultados, cada uma com o botão de tirar;
- os botões "Pular" e "Adicionar".

### CA2

**Marca:** teste HTTP

**Cenário:**
- Dado um Canal privado e Pessoas chamadas "Élida Rocha" e "Elias Prado", quando a Membro busca
  `eli`, então as duas aparecem; buscando `élida`, só a primeira.
- `%`, `_` e `\` no texto valem como literais.
- Quem já é Membro não aparece.
- Com `q` vazio, vêm as primeiras em ordem alfabética, até o `limite da busca de Pessoas`.
- Quem não é Membro de `not_member_of` recebe 404, e `not_member_of` malformado ou ausente recebe
  400.

**Teste previsto:** e2e da API, `test/people-search.e2e-spec.ts`: "acha o nome sem diferenciar
acentos e maiúsculas", "trata %, _ e \\ como literais", "deixa de fora os Membros da Conversa",
"devolve até 20 em ordem alfabética", "responde 404 para quem não é Membro" e "responde 400 sem
not_member_of válido".

### CA3

**Marca:** teste HTTP

**Cenário:**
- Dada a Membro de um Canal privado, quando ela adiciona duas Pessoas, então recebe 200 com
  `added_person_ids` das duas e `member_count` 3, e as duas viram Membros.
- Adicionar de novo quem já é Membro devolve `added_person_ids` sem ela.
- Canal público: `members_not_editable` (409).
- Quem não é Membro: 404.
- `person_ids` vazio, repetido, com 101 ids ou com um id que não é de Pessoa: 400.
- Sem Sessão: 401.

**Teste previsto:** e2e da API, `test/memberships-add.e2e-spec.ts`, um caso por cenário.

### CA4

**Marca:** teste HTTP

**Cenário:**
- Dada uma Membro antiga e uma Pessoa adicionada, as duas conectadas, quando a adição acontece,
  então:
  - a antiga recebe `conversation.member_added` com `person_ids` das adicionadas;
  - a adicionada recebe o evento com `person_ids` só com ela;
  - quem não é Membro não recebe nada.
- A adição sem Pessoa nova não publica.

**Teste previsto:** e2e da API, `test/realtime-conversations.e2e-spec.ts`, "a adição chega aos
Membros antigos e novos" e "a adição sem Pessoa nova não gera evento".

### CA5

**Marca:** teste no Playwright

**Cenário:** O Server Action `addMembers` e a rota `GET /api/people` levam a busca e a adição da
tela à API. Os dois são provados pelos testes de CA8; o 401 leva a "Entrar" pelo
`GET /api/session/expired`, como os outros Server Actions.

**Teste previsto:** Playwright, os de CA8.

### CA6

**Marca:** teste no Playwright

**Cenário:**
- Dado um Canal privado recém-criado, então o passo "Adicionar pessoas" aparece, com o foco na
  busca.
- Digitar busca depois da `espera da busca de Pessoas`.
- Escolher uma Pessoa a põe acima dos resultados, com um botão para tirar.
- "Adicionar" confirma.
- Esc, o X ou "Pular" abrem o Canal só com quem o criou.

**Teste previsto:** Playwright, `e2e/canais-privados/adicionar-pessoas-na-criacao.spec.ts` e
`e2e/canais-privados/pular-adicionar-pessoas.spec.ts`.

### CA7

**Marca:** teste HTTP

**Cenário:** Os testes de CA2, CA3 e CA4 cobrem a busca, a adição e o evento. Um teste a mais
prova que a Pessoa adicionada recebe o `message.created` do Canal e abre a Conversa no WebSocket.
O evento da criação de Canal privado chegando só às abas de quem o criou já é provado pela T03.

**Teste previsto:** e2e da API, `test/realtime-conversations.e2e-spec.ts`, "a Pessoa adicionada
recebe as Mensagens e abre a Conversa".

### CA8

**Marca:** teste no Playwright

**Cenário:**
- Dadas duas Pessoas, quando uma cria um Canal privado e adiciona a outra pela busca, então o Canal
  aparece para a outra sem recarregar, com o cadeado. A Mensagem enviada antes da adição aparece
  ao abri-lo, e a nova chega em tempo real.
- A falha ao adicionar, pelo `page.route`, mantém as escolhidas e mostra o erro.
- Tudo pelo teclado.
- O axe não acha violações no passo.

**Teste previsto:** Playwright, `e2e/canais-privados/adicionar-pessoas-na-criacao.spec.ts`,
`e2e/canais-privados/falha-ao-adicionar.spec.ts` e
`e2e/canais-privados/adicionar-pessoas-sem-violacoes.spec.ts`.

### CA9

**Marca:** documento

**Cenário:** Quem revisa encontra nesta pasta `validacao-visual.md`, com as capturas do passo nos
dois temas, ao lado dos frames do CA1.

## Contrato

### GET /v1/people · nova

| Item | O que descreve |
| --- | --- |
| Autenticação | Sessão, pelo cookie |
| Parâmetros de consulta | `q` (texto, opcional); `not_member_of` (uuid, obrigatório) |
| Resposta de sucesso | 200 com `people`: `id`, `name`, em ordem alfabética, até o `limite da busca de Pessoas` |
| Erros | 400 `validation_failed`; 401 `unauthenticated`; 404 `conversation_not_found` |

### POST /v1/conversations/:id/members · nova

| Item | O que descreve |
| --- | --- |
| Autenticação | Sessão, pelo cookie |
| Corpo da requisição | `person_ids`: uuid[], de 1 até as `Pessoas por adição ao Canal`, sem repetir |
| Resposta de sucesso | 200 com `added_person_ids` (uuid[]) e `member_count` |
| Erros | 400 `validation_failed`; 401 `unauthenticated`; 404 `conversation_not_found`; 409 `members_not_editable` |

### conversation.member_added · servidor → cliente · alterado

| Item | Antes | Depois |
| --- | --- | --- |
| Quando sai | Na criação de Canal | Também na adição, para os Membros antigos e novos |

### BFF: `GET /api/people` · nova

| Item | O que descreve |
| --- | --- |
| Rota da API | `GET /v1/people`, com os mesmos parâmetros |
| Resposta de sucesso | 200 com as Pessoas no formato da web (`id`, `name`, `initials`) |
| Erros | 401, 404 e 502, como a rota de Mensagens da F02 |

### Server Action `addMembers` · novo

| Item | O que descreve |
| --- | --- |
| Entrada | `conversationId`, `personIds` |
| Rota da API | `POST /v1/conversations/:id/members` |
| Resposta | `ok` (com `addedPersonIds` e `memberCount`), `invalid`, `not_found`, `not_editable`, `unauthenticated` ou `failure` |

### Extensão `unaccent` · chat · nova

A migração cria a extensão (`CREATE EXTENSION IF NOT EXISTS unaccent`), escrita à mão.

## Verificação do contrato

- `GET /v1/people` 200, 400 e 404: CA2. O 401 segue o guard, sem teste novo além do das rotas da F02.
- `POST /v1/conversations/:id/members` 200, 400, 401, 404 e 409: CA3.
- `conversation.member_added` na adição: CA4.
- `GET /api/people` e `addMembers`: CA5 e CA8.
- Extensão `unaccent`: CA2.

## Decisões

- A busca e a adição ficam no módulo `memberships`. O de Pessoas não importa o de Conversas, que já
  importa o dele. O `PeopleService.search(q, excludeIds, limit)` recebe os ids a deixar de fora do
  `ConversationsService.listMemberIds`, sem ler a tabela de outro módulo.
- A busca filtra e corta no banco, em ordem do nome sem acento, e a aplicação reordena os até 20
  pela `compareNames`.
- `ConversationsService.addMembers(personId, conversationId, personIds)` é a transação: confere a
  participação, o tipo e as Pessoas (`findByIds`), grava tolerando quem já é Membro e devolve
  `added_person_ids` e o `member_count`. O `MembershipsService` publica depois, como na criação.
- `MembersNotEditableError` (`members_not_editable`, 409) é o código novo do catálogo.
- No web, o passo é o componente `AddPeopleStep`, que a T05 reaproveita, e a linha de Pessoa é o
  `PersonRow` (`components/user/person-row.tsx`). O `AddChannelAction` guarda o Canal privado
  recém-criado e, ao fechar o diálogo por qualquer caminho, leva a ele.
- O título do passo é "Adicionar pessoas ao #nome", com a descrição "Só quem está no canal vê as
  mensagens dele.". A busca é "Buscar por nome", e o vazio é "Ninguém encontrado com esse nome.".
  Os botões são "Pular" e "Adicionar", e a falha é "Não foi possível adicionar as pessoas. Tente de
  novo.".
- A resposta de uma busca mais antiga é descartada por um contador de buscas.

## Arquivos e interfaces

- `apps/chat-api/migrations/<timestamp>-AddUnaccent.ts`.
- `apps/chat-api/src/people/people.service.ts`: `search`.
- `apps/chat-api/src/conversations/conversations.service.ts`: `addMembers` e o `insertMembers` com o
  retorno das gravadas.
- `apps/chat-api/src/conversations/members-not-editable.error.ts`.
- `apps/chat-api/src/memberships/*`: as duas rotas, os DTOs e a publicação da adição.
- `apps/chat-api/src/common/errors/*`: o código novo.
- `apps/web/src/app/services/chat-api.ts`: `searchPeople` e `addMembers`.
- `apps/web/src/app/api/people/route.ts` e `apps/web/src/app/actions/add-members.ts`.
- `apps/web/src/app/components/user/person-row.tsx`,
  `apps/web/src/app/components/conversation/add-people-step.tsx`.
- `apps/web/src/app/components/workspace-nav/add-channel-action.tsx` e
  `create-channel-dialog.tsx`: o passo depois do Canal privado.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum. A spec e o LLD já registram as rotas, os valores e o evento.
