# Plano da F03-T07: Recuperar o que se perdeu sem recarregar

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** revisão humana

**Cenário:** Dado o diff, quem revisa encontra o serviço `redis` (`redis:8`) no `compose.yaml`, com
healthcheck e volume, a `chat-api` dependendo dele, `REDIS_URL` e `TEST_REDIS_URL` no schema de
configuração e no compose, a linha do Redis na tabela de serviços do `AGENTS.md` da raiz e o LLD,
"Ambiente de desenvolvimento", com o Redis como `existe`.

### CA2

**Marca:** teste HTTP

**Cenário:** Dado um Membro conectado, quando uma Mensagem é enviada, então o `message.created` dele
leva `event_id` no formato `<época>:<id do stream>`, e dois envios seguidos têm ids crescentes.

**Teste previsto:** e2e da API, `test/realtime-recovery.e2e-spec.ts`, "o evento leva o cursor da
Pessoa, crescente".

### CA3

**Marca:** teste HTTP

**Cenário:**
- Dado um cursor válido, quando o socket conecta com ele, então recebe só os `message.created`
  posteriores, em ordem, e depois `sync` com `reset` falso e o cursor do último.
- Sem cursor, `sync` com `reset` verdadeiro e o cursor atual da Pessoa.
- Com o cursor de outra época, `reset` verdadeiro.
- Com um cursor anterior ao corte (o `max-deleted-entry-id` do stream é maior que ele), `reset`
  verdadeiro.

**Teste previsto:** e2e da API, `test/realtime-recovery.e2e-spec.ts`: "reenvia em ordem os eventos
depois do cursor", "sem cursor, sync com reset", "cursor de outra época, sync com reset", "cursor
anterior ao corte, sync com reset".

### CA4

**Marca:** teste de unidade e teste no Playwright

**Cenário:** O provedor guarda o cursor em memória e o manda em cada handshake. Até o `sync`, guarda
os eventos recebidos e os aplica em ordem de id de evento, sem repetir; depois, aplica na chegada e
avança o cursor. As Mensagens recuperadas seguem a regra da pílula.

**Teste previsto:** Vitest, `src/app/utils/event-cursor.test.ts`: comparação de cursores, maior
cursor e ordem dos eventos guardados; Playwright (CA7).

### CA5

**Marca:** teste HTTP

**Cenário:** Com o Redis fora, o envio responde 201, o `message.created` chega sem `event_id`, e a
conexão recebe `sync` com `reset` verdadeiro.

**Teste previsto:** e2e da API, `test/realtime-recovery.e2e-spec.ts`, "com o Redis fora, o envio
responde 201, o evento sai sem cursor e a conexão recebe reset", numa aplicação de teste com o
`REDIS_URL` apontando para uma porta sem Redis.

### CA6

**Marca:** teste HTTP

**Cenário:** Os testes de CA2, CA3 e CA5.

**Teste previsto:** os mesmos.

### CA7

**Marca:** teste no Playwright

**Cenário:**
- Dadas duas Pessoas no Canal, quando a primeira fica offline, a outra envia e a primeira volta,
  então a Mensagem aparece uma vez, sem recarregar a página (uma marca posta na `window` antes da
  queda continua lá).
- Quando, durante a queda, a época do Redis é apagada, então ao voltar a Conversa recarrega as
  mais recentes, a Mensagem aparece e o texto da caixa continua lá.

**Teste previsto:** Playwright, `e2e/tempo-real/recuperar-depois-da-queda.spec.ts`: "a Mensagem da
queda curta aparece uma vez, sem recarregar" e "com a época apagada, recarrega as mais recentes e
mantém o texto".

### CA8

**Marca:** documento

**Cenário:** Quem revisa encontra nesta pasta `roteiro-manual.md`, com os passos para uma pessoa
conferir a nota 100 de Acessibilidade do Lighthouse com a faixa e a pílula, e uma queda de verdade
(Wi-Fi desligado e computador suspenso por 1 min), e o resultado de quem rodou.

## Contrato

### Conexão do WebSocket · alterada

| Item | Antes | Depois |
| --- | --- | --- |
| Carga | Nenhuma | `auth.cursor` (texto, opcional): o último cursor que a aba recebeu |
| Efeito | Salas e `sync` com `reset` | Salas, reenvio dos `message.created` depois do cursor e `sync` |

### message.created · alterado

| Item | Antes | Depois |
| --- | --- | --- |
| Quem recebe | As salas `person:` de todos os Membros, numa emissão só | Cada sala `person:`, com o cursor daquela Pessoa |
| Carga | `message`, sem `event_id` | `event_id` (`<época>:<id do stream>`) e `message`; sem `event_id` só quando o Redis falhou |

### sync · alterado

| Item | Antes | Depois |
| --- | --- | --- |
| Carga | `cursor` nulo e `reset` verdadeiro | `cursor` atual da Pessoa (nulo com o Redis fora) e `reset` verdadeiro só sem cursor, com época diferente, com o corte depois do cursor ou com o Redis fora |

### events:person:<id> e events:epoch · Redis · novos

- `events:person:<id>`: stream; cada entrada tem o campo `event` com o evento em JSON. Cada `XADD`
  corta com `MINID ~` de agora menos a `retenção dos eventos de reconexão`.
- `events:epoch`: texto aleatório, criado com `SET NX` quando falta.

## Verificação do contrato

- `event_id` no `message.created`: CA2.
- Reenvio depois do cursor e os quatro casos de `sync`: CA3.
- Redis fora: CA5.

## Decisões

- **Cliente `redis` (node-redis 5), com `disableOfflineQueue`.** Com o Redis fora, os comandos
  falham na hora, em vez de esperar a reconexão e prender o envio. A conexão sobe sem esperar o
  Redis, para a API subir mesmo com ele fora.
- **Comandos de stream pelo `sendCommand`.** `XADD`, `XRANGE` e `XINFO STREAM` em forma crua, com a
  leitura das respostas num só lugar, o `EventsStore`.
- **`EventsStore` no módulo `realtime`.** `append(personIds, event)` grava um evento por Pessoa num
  pipeline e devolve os cursores; `readSince(personId, cursor)` devolve os eventos e o cursor
  atual, ou `lost`; `currentCursor(personId)`. O cursor é comparado pelos números do id do stream.
- **O publicador emite por Pessoa.** Com os cursores do `append`, cada sala `person:` recebe o seu.
  Com o Redis fora, emite numa chamada só, sem `event_id`, e registra `error`.
- **A conexão lê o cursor do `handshake.auth`.** As salas já entram no middleware (T01); o
  `handleConnection` lê os eventos depois do cursor, os emite e manda o `sync`.
- **No cliente, o `auth` é uma função**, lida a cada tentativa de conexão, com o cursor do momento.
  As funções puras de cursor e da fila até o `sync` ficam em `utils/event-cursor.ts`.
- **Testes com o Redis de testes** (`TEST_REDIS_URL`, banco lógico 1), pelo `test-env.ts`, e um
  atalho que apaga as chaves de uma Pessoa e a época. O teste do Redis fora sobe outra aplicação com
  o `REDIS_URL` trocado no ambiente do processo antes de criá-la.
- **O Playwright fala com o Redis de desenvolvimento** por uma fixture, como as do banco; o `e2e`
  ganha `REDIS_URL` e a web, o pacote `redis` só para os testes.

## Arquivos e interfaces

- `compose.yaml`, `AGENTS.md` (tabela de serviços), `apps/chat-api/.env.example`.
- `apps/chat-api/src/config/env.schema.ts`: `REDIS_URL`.
- `apps/chat-api/src/redis/`: `RedisModule` e o token `REDIS_CLIENT`.
- `apps/chat-api/src/realtime/events.store.ts`, `realtime.publisher.ts`, `realtime.gateway.ts`,
  `realtime-values.ts` (`EVENTS_RETENTION_MS`).
- `apps/chat-api/test/realtime-recovery.e2e-spec.ts`, `test/support/test-env.ts` e
  `test/support/realtime-routes.ts`.
- `apps/web/src/app/utils/event-cursor.ts` e o teste; `realtime-provider.tsx`.
- `apps/web/e2e/support/redis.ts` e `apps/web/e2e/tempo-real/recuperar-depois-da-queda.spec.ts`.

## Testes existentes que mudam

- `test/realtime-messages.e2e-spec.ts`: o `message.created` passa a levar `event_id`, e o `sync` da
  primeira conexão, o cursor atual (não mais nulo).

## Mudança de dados

Nenhuma no banco. O Redis começa vazio.

## Documentos atualizados

Nenhum. O mecanismo está na spec e no LLD, "Integrações externas", "Eventos por pessoa".
