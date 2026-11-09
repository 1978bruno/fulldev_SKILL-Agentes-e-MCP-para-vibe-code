# Plano da F04-T03: Canais novos na barra lateral sem recarregar

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste HTTP

**Cenário:** Dado o pacote `chat-events`, o evento `conversation.member_added` tem `event_id`
(opcional), `conversation` (`id`, `kind`, `name`, `topic`, `member_count`) e `person_ids`, e os
testes da API o recebem nessa forma.

**Teste previsto:** e2e da API, `test/realtime-conversations.e2e-spec.ts`, "o Canal público novo
chega a todas as Pessoas conectadas", que confere a carga inteira.

### CA2

**Marca:** teste HTTP

**Cenário:**
- Dadas duas Pessoas conectadas, quando uma cria um Canal público, então as duas recebem
  `conversation.member_added` com o Canal, `member_count` e o `person_ids` de todas as Pessoas, e
  com um `event_id`.
- Quando a mesma Pessoa reenvia o mesmo `client_id`, nenhum socket recebe outro evento.
- Quando uma Pessoa cria um Canal privado, então só as abas dela recebem o evento, com
  `person_ids` só dela; a outra Pessoa não recebe nada.
- Com o Redis fora, o evento sai sem `event_id`.

**Teste previsto:** e2e da API, `test/realtime-conversations.e2e-spec.ts`: "o Canal público novo
chega a todas as Pessoas conectadas", "o reenvio da criação não gera outro evento", "o Canal
privado novo chega só às abas de quem o criou" e "com o Redis fora, o evento sai sem event_id".

### CA3

**Marca:** teste no Playwright

**Cenário:** Dada uma Pessoa com a barra lateral aberta, então a lista de Canais vem do cache do
cliente, com a lista do servidor como ponto de partida: o esqueleto e o erro continuam como na
F02.

**Teste previsto:** Playwright, os testes da barra lateral da F02 continuam passando
(`e2e/conversa/abrir-canal-pela-barra-lateral.spec.ts`, `secao-canais-recolhe.spec.ts`,
`linha-ativa.spec.ts`), e o de CA7.

### CA4

**Marca:** teste de unidade

**Cenário:** Dada a lista de Conversas e um evento:
- com a Pessoa da aba em `person_ids`, a Conversa entra na ordem alfabética;
- um id que já está na lista não se repete, e o `member_count` dele é atualizado;
- sem a Pessoa em `person_ids`, só o `member_count` muda, e uma Conversa fora da lista não entra.

**Teste previsto:** Vitest, `src/app/utils/conversation-list.test.ts`.

### CA5

**Marca:** teste no Playwright

**Cenário:** Dada uma Pessoa com o chat aberto e a aba offline, quando outra Pessoa cria um Canal
público e o cursor da primeira fica perdido (a época apagada no Redis), então, ao reconectar, o
`sync` com `reset` faz a barra lateral buscar a lista de novo por `GET /api/conversations`, e o
Canal aparece.

**Teste previsto:** Playwright, `e2e/canais-publicos/canal-novo-depois-da-queda.spec.ts`, "o reset
recarrega a lista e traz o Canal criado durante a queda".

### CA6

**Marca:** teste HTTP

**Cenário:** Dada uma Pessoa conectada que cai, quando outra cria um Canal público e a primeira
reconecta com o cursor, então recebe o `conversation.member_added` reenviado, antes do `sync`.

**Teste previsto:** e2e da API, `test/realtime-conversations.e2e-spec.ts`, "o evento volta na
reconexão com cursor".

### CA7

**Marca:** teste no Playwright

**Cenário:** Dadas duas Pessoas com o chat aberto, quando uma cria um Canal público, então ele
aparece na barra lateral da outra sem recarregar, na ordem alfabética, sem tirar o foco da caixa de
mensagem e sem abrir o Canal.

**Teste previsto:** Playwright, `e2e/canais-publicos/canal-novo-sem-recarregar.spec.ts`, "o Canal
público criado por outra Pessoa aparece na barra lateral sem recarregar".

### CA8

**Marca:** documento

**Cenário:** Quem revisa encontra `medicao-p95.md` nesta pasta, com o método (50 sockets de Pessoas
diferentes, 50 Canais públicos criados por REST, tempo entre a resposta da criação e a chegada do
`conversation.member_added` em cada socket), o p95 medido e a comparação com o critério do PRD (até
1 s).

## Contrato

### conversation.member_added · servidor → cliente · novo

| Item | O que descreve |
| --- | --- |
| Quem recebe | As salas `person:<id>` de todos os Membros da Conversa depois da gravação |
| Autenticação | A da conexão (F03) |
| Carga | `event_id` (texto, opcional: ausente se o Redis falhou), `conversation` (`id`, `kind`, `name`, `topic`, `member_count`, no formato do REST), `person_ids` (uuid[], as Pessoas que entraram agora) |
| Confirmação | Nenhuma |
| Erros | Nenhum |

O evento é guardado no stream de cada Membro e reenviado na reconexão com cursor, como o
`message.created`.

### GET /api/conversations · nova (BFF)

| Item | O que descreve |
| --- | --- |
| Autenticação | O cookie de sessão, repassado à API |
| Rota da API | `GET /v1/conversations` |
| Resposta de sucesso | 200 com `conversations`, no formato da web (`memberCount`) |
| Erros | 401 sem Sessão (o cliente leva a `GET /api/session/expired`); 502 na falha da API |

## Verificação do contrato

- `conversation.member_added` na criação de Canal público e privado, sem evento no reenvio, sem
  `event_id` com o Redis fora: CA2.
- `conversation.member_added` reenviado na reconexão: CA6.
- `GET /api/conversations` 200: CA5. O 401 e o 502 seguem o padrão da rota de Mensagens da F02, sem
  teste próprio.

## Decisões

- O publisher ganha `memberAdded(memberIds, payload)` e passa a ter um caminho só para os eventos
  guardados por Pessoa (`publish(name, memberIds, payload)`), usado também pelo `message.created`.
- A reconexão reenvia todos os eventos guardados, e não só `message.created`: o filtro por nome sai
  do gateway.
- A publicação acontece depois do commit, fora da resposta, como o envio de Mensagem: um método
  `createChannelAndPublish` chama o `createChannel`, que é a transação, e só depois publica, e só
  quando o Canal foi criado agora. O controller passa a chamá-lo.
- No cliente, o provedor guarda os eventos até o `sync` numa fila só, com o nome de cada um, e
  aplica em ordem. A assinatura ganha `onConversationAdded`.
- A barra lateral passa a ter um componente cliente `ChannelList`, com `useSWR` de chave
  `/api/conversations` e a lista do Server Component como `fallbackData`. O evento muda o cache por
  `mutate` com a função pura de aplicação, sem revalidar; o `reset` revalida.
- O `revalidatePath` do Server Action da criação fica: a aba que criou também recebe o evento, mas
  a navegação para o Canal precisa da página nova.
- A medição usa o script de medição da F03 como base (`test/measure`).

## Arquivos e interfaces

- `packages/chat-events/index.d.ts`: `ConversationPayload`, `ConversationMemberAddedEvent` e o
  evento em `ServerToClientEvents`.
- `apps/chat-api/src/realtime/realtime.publisher.ts`: `memberAdded` e o caminho comum.
- `apps/chat-api/src/realtime/realtime.gateway.ts`: o reenvio de todos os eventos.
- `apps/chat-api/src/conversations/*`: a publicação depois da criação.
- `apps/web/src/app/components/realtime/realtime-provider.tsx`: a fila com nomes e
  `onConversationAdded`.
- `apps/web/src/app/utils/conversation-list.ts`: a função de aplicação.
- `apps/web/src/app/api/conversations/route.ts`: a rota do BFF.
- `apps/web/src/app/components/workspace-nav/channel-list.tsx` e `sidebar.tsx`: a lista no
  cliente.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum. A spec e o LLD já registram o evento e a rota do BFF; a tarefa só os implementa.
