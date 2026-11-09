# Plano da F03-T02: Mensagens dos outros chegam sem recarregar

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste HTTP

**Cenário:** Dado um Canal com duas Pessoas conectadas, quando uma envia uma Mensagem pelo REST, então
cada Membro recebe `message.created` com a Mensagem no formato do REST e sem `event_id`. Quando a
mesma Pessoa reenvia o mesmo `client_id`, nenhum socket recebe outro evento.

**Teste previsto:** e2e da API, `test/realtime-messages.e2e-spec.ts`, "emite message.created para os
Membros depois de gravar" e "o reenvio do mesmo client_id não emite outro evento".

### CA2

**Marca:** teste HTTP e teste no Playwright

**Cenário:**
- Dado um socket que conecta, então ele recebe `sync` com `cursor` nulo e `reset` verdadeiro.
- Dada uma Pessoa com a Conversa aberta, quando outra envia uma Mensagem enquanto a primeira ainda
  não estava conectada e a conexão chega depois, então o `reset` faz a Conversa buscar de novo a
  página mais recente e a Mensagem aparece, sem perder o texto da caixa de mensagem nem as
  pendentes.

**Teste previsto:** e2e da API, `test/realtime-messages.e2e-spec.ts`, "emite sync com reset na
conexão"; Playwright, `e2e/tempo-real/reset-recarrega-a-mais-recente.spec.ts`, "o reset traz a
Mensagem gravada antes da conexão e mantém o texto da caixa". No Playwright, a conexão é segurada
pelo `routeWebSocket` até a outra Pessoa enviar.

### CA3

**Marca:** teste de unidade

**Cenário:** Dadas as páginas do cache e as pendentes:
- a Mensagem que chega entra em ordem de id;
- um id que já está no cache é ignorado;
- a pendente de mesmo `client_id` sai das pendentes;
- a resposta do Server Action que chega depois não duplica a Mensagem;
- as pendentes continuam no fim.

**Teste previsto:** Vitest, `src/app/utils/message-pages.test.ts`, os casos de
`appendToLatestPage` com a Mensagem que chega pelo evento, e `src/app/utils/pending-messages.test.ts`,
"tira a pendente de mesmo client_id".

### CA4

**Marca:** teste no Playwright

**Cenário:** Dada uma Pessoa conectada com o Canal A aberto, quando outra Pessoa envia uma Mensagem no
Canal B e a primeira abre o Canal B, então a Mensagem aparece nele, mesmo que tenha chegado enquanto o
servidor lia o histórico.

**Teste previsto:** Playwright, `e2e/tempo-real/mensagem-de-outra-conversa.spec.ts`, "a Mensagem que
chegou em outro Canal aparece ao abri-lo". A junção pelo buffer do provedor é provada também pelo
Vitest, `src/app/utils/recent-messages.test.ts`, "guarda as últimas 100 por Conversa".

### CA5

**Marca:** teste de unidade

**Cenário:** A função das iniciais deixa de ser só do servidor e é a mesma no service do BFF e no
cliente; os casos de nome com uma palavra, várias, acento combinado e caractere fora do BMP passam.

**Teste previsto:** Vitest, `src/app/utils/initials.test.ts`.

### CA6

**Marca:** teste HTTP e teste de unidade

**Cenário:** Os testes de CA1 também provam que o evento chega à outra aba do autor e não chega a quem
não é Membro (participação apagada no Arrange). O Vitest prova CA3 e CA5.

**Teste previsto:** e2e da API, `test/realtime-messages.e2e-spec.ts`, "o evento chega à outra aba do
autor" e "quem não é Membro não recebe o evento".

### CA7

**Marca:** teste no Playwright

**Cenário:**
- Dadas duas Pessoas com o mesmo Canal aberto, quando uma envia, então a Mensagem aparece para a
  outra sem recarregar, com o autor.
- Dada uma Pessoa com o Canal aberto em duas abas, quando envia por uma, então a Mensagem aparece na
  outra uma vez só.

**Teste previsto:** Playwright, `e2e/tempo-real/mensagem-chega-sem-recarregar.spec.ts`, "a Mensagem
da outra Pessoa aparece sem recarregar" e "a Mensagem enviada por outra aba aparece uma vez só".

### CA8

**Marca:** documento

**Cenário:** Quem revisa encontra `medicao-p95.md` nesta pasta, com o método (50 sockets de Pessoas
diferentes num Canal, 200 Mensagens enviadas pelo REST, tempo entre a resposta do envio e a chegada
do `message.created` em cada socket), o p95 medido e a comparação com o critério do PRD (até 1 s).

## Contrato

### message.created · servidor → cliente · novo

| Item | O que descreve |
| --- | --- |
| Quem recebe | As salas `person:<id>` de todos os Membros da Conversa, inclusive o autor |
| Autenticação | A da conexão (T01) |
| Carga | `message` (obrigatório), no formato da Mensagem do REST: `id`, `conversation_id`, `client_id`, `author` (`id`, `name`), `body`, `created_at`. `event_id` ausente nesta tarefa; a tarefa 07 o preenche |
| Confirmação | Nenhuma |
| Erros | Nenhum |

### sync · servidor → cliente · novo

| Item | O que descreve |
| --- | --- |
| Quem recebe | O socket que acabou de conectar |
| Autenticação | A da conexão |
| Carga | `cursor` nulo e `reset` verdadeiro, sempre, nesta tarefa. A tarefa 07 passa o cursor e o `reset` só quando houve perda |
| Confirmação | Nenhuma |
| Erros | Nenhum |

O contrato HTTP não muda: `POST /v1/conversations/:id/messages` continua com a mesma resposta, e a
publicação é um efeito depois da gravação.

## Verificação do contrato

- `message.created` para os Membros, sem `event_id`: CA1.
- `message.created` à outra aba do autor e não a quem não é Membro: CA6.
- O reenvio não emite: CA1.
- `sync` com `reset` na conexão: CA2.

## Decisões

- **Publicação num service do módulo `realtime`.** O `RealtimePublisher` recebe os ids dos Membros e
  a Mensagem já no formato do evento e emite numa chamada só para as salas `person:` deles. O
  `MessagesService` ganha `sendMessage`, que grava pelo `send` (a transação) e, só quando a linha é
  nova, lê os Membros e publica. Assim a tarefa 07 troca a emissão por Pessoa sem mexer no envio.
- **`send` diz se gravou agora.** O `INSERT ... ON CONFLICT DO NOTHING` já sabe: a linha veio no
  `RETURNING` ou não. O retorno passa a `{ message, created }`.
- **Membros pelo service de Conversas.** `ConversationsService.listMemberIds(conversationId)`, uma
  consulta só em `conversation_members`.
- **A junção reaproveita `appendToLatestPage`.** Ela já põe em ordem de id e ignora id repetido. A
  retirada da pendente vira uma função pura ao lado, `withoutDelivered(pending, message)`.
- **O provedor guarda o buffer e repassa os eventos.** Ele escuta `message.created` e `sync` uma vez
  por socket, guarda as últimas 100 Mensagens por Conversa (função pura `rememberMessage`) e avisa os
  assinantes. O histórico assina enquanto está montado e, ao montar, junta do buffer as que são mais
  novas que a primeira página.
- **`reset` busca a mais recente pela rota do BFF que já existe.** `GET /api/conversations/:id/messages`
  sem `before` devolve a página mais recente; o cache vira só ela, e as pendentes e o texto ficam
  porque moram fora do cache.
- **Iniciais no cliente.** `utils/initials.ts` perde o `server-only`. O motivo dele era a
  hidratação, e as Mensagens do evento nunca passam pelo servidor. Os navegadores de desktop que o
  produto atende têm `Intl.Segmenter`.
- **Medição por script na API.** Um script de teste da `chat-api` (`test/measure/`) conecta 50
  sockets e envia 200 Mensagens, fora da suíte, rodado à mão para o registro.

## Arquivos e interfaces

- `apps/chat-api/src/messages/messages.service.ts`: `send` devolve `{ message, created }`;
  `sendMessage(author, conversationId, newMessage)` grava e publica.
- `apps/chat-api/src/messages/messages.controller.ts` e `messages.module.ts`: usam `sendMessage`;
  importam o `RealtimeModule`.
- `apps/chat-api/src/conversations/conversations.service.ts`: `listMemberIds(conversationId)`.
- `apps/chat-api/src/realtime/realtime.publisher.ts`: `RealtimePublisher.messageCreated(memberIds,
  message)`.
- `apps/chat-api/src/realtime/realtime.gateway.ts`: emite `sync` na conexão.
- `apps/chat-api/test/realtime-messages.e2e-spec.ts` e `test/measure/message-latency.ts`.
- `apps/web/src/app/components/realtime/realtime-provider.tsx`: buffer, assinatura
  (`subscribe({ onMessage, onSync })`) e `recentMessages(conversationId)`.
- `apps/web/src/app/utils/recent-messages.ts`, `pending-messages.ts`, `message-event.ts` (evento →
  `Message`, com as iniciais) e `initials.ts`.
- `apps/web/src/app/hooks/use-message-history.ts`: `receive(message)` e `reloadLatest()`.
- `apps/web/src/app/hooks/use-pending-messages.ts`: `dropDelivered(message)`.
- `apps/web/src/app/components/conversation/message-history.tsx`: liga o histórico ao provedor.
- `apps/web/e2e/tempo-real/`: os três specs novos.

## Testes existentes que mudam

Nenhum muda de comportamento. Os testes da API que chamam `send` passam pelo novo retorno.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum. A publicação e o `sync` já estão no LLD ("Transações") e na spec.
