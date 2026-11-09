# Plano da F03-T04: "Digitando"

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste HTTP

**Cenário:**
- Dado um socket de um Membro, quando ele emite `conversation.open`, então a confirmação é
  `{ ok: true }` e ele passa a receber o "digitando" daquela Conversa.
- Dado um socket de quem não é Membro, a confirmação é `{ ok: false, code: "conversation_not_found" }`
  e ele não recebe o "digitando" da Conversa.
- Quando o socket abre outra Conversa, ou emite `conversation.close`, deixa de receber o da
  anterior.

**Teste previsto:** e2e da API, `test/realtime-typing.e2e-spec.ts`: "abre a Conversa de que a Pessoa
é Membro", "recusa a Conversa de quem não é Membro", "abrir outra Conversa sai da anterior".

### CA2

**Marca:** teste HTTP

**Cenário:** Dados dois Membros com a Conversa aberta e uma segunda aba do primeiro, quando o
primeiro emite `typing.start` e depois `typing.stop`, então o segundo recebe os dois com a Conversa e
a Pessoa (`id`, `name`), e as abas do próprio primeiro não recebem nada. Um `typing.start` de um
socket que não abriu a Conversa não é repassado.

**Teste previsto:** e2e da API, `test/realtime-typing.e2e-spec.ts`: "repassa o digitando aos outros
da sala, sem as abas da própria Pessoa" e "ignora o digitando de quem não abriu a Conversa".

### CA3

**Marca:** teste de unidade

**Cenário:** A regra de quando avisar é uma função pura: com texto não vazio, avisa se nunca avisou
ou se já passou o `intervalo do aviso de digitando` desde o último aviso; com o texto vazio depois
de ter avisado, manda o aviso de que parou. O envio e a troca de Conversa também mandam que parou,
pela caixa de mensagem.

**Teste previsto:** Vitest, `src/app/utils/typing.test.ts`, "avisa ao começar", "não repete antes do
intervalo", "avisa de novo depois do intervalo", "avisa que parou ao apagar tudo".

### CA4

**Marca:** teste de unidade e teste no Playwright

**Cenário:** Quem vê guarda as Pessoas que digitam, cada uma com o prazo da `expiração do
digitando`; o aviso de que parou tira a Pessoa; a queda da própria conexão esvazia a lista.

**Teste previsto:** Vitest, `src/app/utils/typing.test.ts`, "tira a Pessoa no aviso de que parou" e
"mantém a ordem de chegada"; Playwright (CA7) para o prazo e o envio.

### CA5

**Marca:** teste de unidade

**Cenário:** O texto é "Fulano está digitando…", "Fulano e Beltrana estão digitando…" ou "Várias
pessoas estão digitando…", e vazio sem ninguém.

**Teste previsto:** Vitest, `src/app/utils/typing.test.ts`, "uma Pessoa", "duas Pessoas", "três ou
mais", "ninguém".

### CA6

**Marca:** teste HTTP e teste de unidade

**Cenário:** Os testes de CA1, CA2, CA3, CA4 e CA5.

**Teste previsto:** os mesmos.

### CA7

**Marca:** teste no Playwright

**Cenário:**
- Dadas duas Pessoas no mesmo Canal, quando a outra escreve, então aparece "Bruno Lima está
  digitando…" na linha acima da caixa; quando ela envia, o aviso some.
- Quando a outra escreve e para, o aviso some depois de 5 s.
- Quem escreve nunca vê o próprio nome.
- A checagem do `@axe-core/playwright` com o aviso na tela não tem violações.

**Teste previsto:** Playwright, `e2e/tempo-real/digitando.spec.ts`: "mostra quem digita e some ao
enviar", "some depois de 5 s sem digitar", "não mostra a própria Pessoa";
`e2e/acessibilidade/digitando-sem-violacoes.spec.ts`.

### CA8

**Marca:** documento

**Cenário:** Quem revisa encontra nesta pasta `medicao-p95.md`, com o p95 do "digitando" (tempo
entre emitir `typing.start` e a chegada nos outros sockets da sala, 50 sockets, 200 avisos) e a
comparação com o critério do PRD (até 1 s), e `validacao-visual.md` com as capturas nos dois temas,
comparadas com o frame "Conversa / Lista / Digitando" (21:8551).

## Contrato

### conversation.open · cliente → servidor · novo

| Item | O que descreve |
| --- | --- |
| Quem pode enviar | Um socket conectado (T01) |
| Autenticação | A da conexão; a participação é conferida pela operação "Conversa da qual a Pessoa é Membro" |
| Carga | `conversation_id` (texto, obrigatório) |
| Confirmação | `{ ok: true }`, ou `{ ok: false, code: "conversation_not_found" }` para Conversa inexistente, sem participação ou com id malformado |
| Efeito | O socket entra na sala `conversation:<id>` e sai da sala da Conversa que tinha aberto antes |

### conversation.close · cliente → servidor · novo

| Item | O que descreve |
| --- | --- |
| Quem pode enviar | Um socket conectado |
| Carga | `conversation_id` |
| Confirmação | Nenhuma |
| Efeito | O socket sai da sala da Conversa, se estava nela |

### typing.start e typing.stop · cliente → servidor · novos

| Item | O que descreve |
| --- | --- |
| Quem pode enviar | Um socket que está na sala da Conversa; os de fora são ignorados |
| Carga | `conversation_id` |
| Confirmação | Nenhuma |
| Erros | Nenhum: o aviso de quem não está na sala é descartado |

### typing.start e typing.stop · servidor → cliente · novos

| Item | O que descreve |
| --- | --- |
| Quem recebe | Os sockets na sala `conversation:<id>`, menos os da sala `person:<id>` de quem digita |
| Carga | `conversation_id` e `person` (`id`, `name`) |

## Verificação do contrato

- `conversation.open` com `ok` e com `conversation_not_found`: CA1.
- Troca de sala ao abrir outra e `conversation.close`: CA1.
- Repasse de `typing.start` e `typing.stop` sem as abas da própria Pessoa: CA2.
- Aviso de quem não está na sala descartado: CA2.

## Decisões

- **Handlers no gateway.** `@SubscribeMessage` para os quatro eventos. A Conversa aberta fica em
  `socket.data.conversationId`; abrir outra sai da sala anterior. A confirmação de
  `conversation.open` é o retorno do handler. O gateway passa a depender do `ConversationsService`.
- **O repasse confere a sala, e não o banco.** `socket.rooms.has(conversationRoom(id))`; a
  participação já foi conferida no `conversation.open`.
- **Funções puras do lado do cliente** em `utils/typing.ts`: `shouldAnnounce` (quando avisar),
  `typingLabel` (o texto) e as operações da lista de quem digita (`addTyper`, `removeTyper`).
- **Dois hooks.** `useTypingAnnouncer(conversationId)`, usado pela caixa de mensagem por uma prop
  nova `onTextChange`, emite os avisos; `useTypingPeople(conversationId)` assina os eventos, guarda
  os prazos de 5 s e esvazia na queda. Os dois usam o socket do provedor.
- **Abrir a Conversa no socket** também num hook do histórico, `useOpenConversation`, que emite
  `conversation.open` ao montar e a cada `connect`, e `conversation.close` ao desmontar.
- **A linha do "digitando"** é a que a F02 reservou, com 20 px de altura, `text-caption`,
  `text-fg-muted` e `px-5`, como o frame (Typing, 21:8417). Sem `aria-live`.
- **Medição** pelo mesmo tipo de script da T02, `test/measure/typing-latency.ts`.

## Arquivos e interfaces

- `apps/chat-api/src/realtime/realtime.gateway.ts`: os quatro handlers.
- `apps/chat-api/src/realtime/realtime-socket.ts`: `conversationRoom(id)` e `conversationId` em
  `RealtimeSocketData`.
- `apps/chat-api/src/realtime/realtime.module.ts`: importa o `ConversationsModule`.
- `apps/chat-api/test/realtime-typing.e2e-spec.ts` e `test/measure/typing-latency.ts`.
- `apps/web/src/app/utils/typing.ts` e `typing.test.ts`.
- `apps/web/src/app/hooks/use-typing.ts`: `useOpenConversation`, `useTypingAnnouncer`,
  `useTypingPeople`.
- `apps/web/src/app/components/conversation/message-composer.tsx`: prop `onTextChange`.
- `apps/web/src/app/components/conversation/typing-indicator.tsx` e `message-history.tsx`.
- `apps/web/e2e/tempo-real/digitando.spec.ts` e `e2e/acessibilidade/digitando-sem-violacoes.spec.ts`.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum. As regras estão no LLD, "Estados e regras", "Digitando", e os valores em "Valores e
configuração".
