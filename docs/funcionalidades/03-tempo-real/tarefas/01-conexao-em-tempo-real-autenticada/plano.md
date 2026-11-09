# Plano da F03-T01: Conexão em tempo real autenticada

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** revisão humana

**Cenário:** Dado o diff, quem revisa encontra `packages/chat-events` com um `package.json` e um
`index.d.ts` só de tipos, com os eventos da tabela "Eventos" da spec. Encontra também a dependência
`chat-events` como `file:../../packages/chat-events` no `web` e na `chat-api`, e os dois lockfiles
atualizados. A linha `chat-events` da "Estrutura do código" do LLD passa a `existe` no commit de
registros.

### CA2

**Marca:** teste HTTP

**Cenário:** Dada a API ouvindo numa porta, quando um cliente abre o Socket.IO só pelo transporte
`websocket`, com o cookie de uma Sessão válida e a origem `WEB_ORIGIN`, então a conexão é aceita.
Sem a variável `WEB_ORIGIN`, a API não sobe e a mensagem cita o nome dela.

**Teste previsto:** e2e da API, `test/realtime.e2e-spec.ts`, "aceita a conexão com Sessão válida e
a origem da web"; e2e da API, `test/startup.e2e-spec.ts`, "a API não sobe sem WEB_ORIGIN e diz o
nome da variável".

### CA3

**Marca:** teste HTTP

**Cenário:**
- Dada uma Sessão válida, quando o socket conecta, então ele está nas salas `person:<id da
  Pessoa>` e `session:<id da Sessão>`.
- Sem cookie, com um token desconhecido ou com a Sessão vencida, o cliente recebe `connect_error`
  com a mensagem `unauthenticated`.
- De outra origem, ou sem origem, o handshake é recusado e o cliente recebe `connect_error`.

**Teste previsto:** e2e da API, `test/realtime.e2e-spec.ts`: "põe o socket nas salas da Pessoa e
da Sessão", "recusa sem cookie com unauthenticated", "recusa a Sessão vencida com
unauthenticated", "recusa outra origem".

### CA4

**Marca:** teste no Playwright

**Cenário:** Dada uma Pessoa logada com um Canal aberto, quando ela troca de Canal pela barra
lateral, então a aba continua com um socket só, conectado, e o estado da conexão exposto pelo
provedor é "conectada".

**Teste previsto:** Playwright, `e2e/tempo-real/conexao-por-aba.spec.ts`, "mantém um socket
conectado ao trocar de Canal".

### CA5

**Marca:** teste no Playwright

**Cenário:** Dada uma Pessoa com um Canal aberto e o socket conectado, quando a Sessão dela é
revogada no banco e a conexão cai e se refaz, então o handshake recebe `unauthenticated` e a aba vai
para "Entrar", com o `?para=` do Canal.

**Teste previsto:** Playwright, `e2e/tempo-real/sessao-revogada-no-handshake.spec.ts`, "vai para
Entrar quando o handshake recusa a Sessão". A queda é provocada pelo `routeWebSocket`, que
encaminha ao servidor e fecha a conexão no meio do teste.

### CA6

**Marca:** teste HTTP

**Cenário:** Dado o diff, a base de testes da API tem um atalho que sobe a aplicação em `127.0.0.1`
numa porta livre e outro que conecta sockets de várias Pessoas, cada um com o cookie dela, e os
testes de CA2 e CA3 o usam.

**Teste previsto:** os mesmos de CA2 e CA3, que dependem da base.

### CA7

**Marca:** teste no Playwright

**Cenário:** Dado o diff, a base do Playwright tem a fixture de uma segunda Pessoa no mesmo Canal da
primeira e um atalho que a faz entrar num contexto novo do navegador. O teste de CA4 abre as duas
Pessoas e confere um socket conectado em cada aba.

**Teste previsto:** Playwright, `e2e/tempo-real/conexao-por-aba.spec.ts`, "conecta as abas de duas
Pessoas no mesmo Canal".

## Contrato

### Conexão do WebSocket · cliente → servidor · nova

| Item | O que descreve |
| --- | --- |
| Endereço | O da API do chat, caminho `/socket.io`, só pelo transporte `websocket` |
| Quem pode conectar | Quem apresenta o cookie de sessão (`SESSION_COOKIE_NAME`) de uma Sessão válida, com a origem igual a `WEB_ORIGIN` |
| Autenticação | O cookie, verificado pelo mesmo `authenticate` do guard REST, no handshake |
| Carga | Nenhuma nesta tarefa. O `auth.cursor` entra na tarefa 07 |
| Efeito | O socket entra nas salas `person:<id>` e `session:<id>` |
| Erros | `connect_error` com a mensagem `unauthenticated` para Sessão ausente, desconhecida ou vencida. A origem diferente é recusada antes do Socket.IO, pelo `allowRequest`, e o cliente recebe `connect_error` |

### Pacote `chat-events` · novo

Os tipos de todos os eventos da tabela "Eventos" da spec (`message.created`, `sync`,
`session.ended`, `conversation.open`, `conversation.close`, `typing.start`, `typing.stop`), com os
campos em `snake_case`, e os mapas de eventos do servidor e do cliente no formato que o Socket.IO
tipa (`ServerToClientEvents`, `ClientToServerEvents`). Nenhum evento é emitido nesta tarefa: as
tarefas 02, 04, 06 e 07 passam a emitir os delas.

## Verificação do contrato

- Conexão aceita com Sessão válida e origem certa: CA2.
- Salas na conexão: CA3.
- `connect_error` com `unauthenticated` (sem cookie, desconhecido, vencido): CA3, e a reação do
  cliente: CA5.
- Origem recusada: CA3.
- Pacote `chat-events`: CA1 (revisão). Os tipos são conferidos pelo `tsc` dos dois projetos.

## Decisões

- **Origem conferida pelo `allowRequest` do Socket.IO.** No transporte `websocket`, o navegador
  não faz CORS e o `cors` do Socket.IO não barra nada. Por isso o servidor compara o cabeçalho
  `Origin` do upgrade com `WEB_ORIGIN` no `allowRequest`. O `cors` com `credentials` fica para o
  caso de um pedido HTTP do Socket.IO.
- **Adaptador próprio do Socket.IO, configurado no `configureApp`.** As opções do servidor
  (`transports`, `allowRequest`, `cors`) dependem de `WEB_ORIGIN`, que vem da configuração. O
  decorator do gateway só aceita valores fixos, e o `configureApp` também roda nos testes.
- **Gateway num módulo `realtime`.** O módulo tem o gateway e o middleware de autenticação, que usa
  o `SessionsService.authenticate` e grava a Pessoa e a Sessão em `socket.data`. As tarefas 02, 04
  e 06 acrescentam a publicação, as salas de Conversa e a reconferência.
- **`chat-events` como `index.d.ts`.** O pacote é só de tipos (spec), e um arquivo de declaração não
  passa pela compilação de nenhum dos dois projetos.
- **Estado da conexão no DOM para os testes.** O provedor marca o elemento raiz da Casca com
  `data-realtime="connecting" | "connected" | "disconnected"`, para os testes do Playwright
  esperarem a conexão sem olhar a rede.
- **O navegador do `e2e` abre a web e a API por `localhost`.** Com a web em `http://web:3000` e a
  API em `http://chat-api:3000`, o cookie de `web` não iria ao WebSocket. O contêiner `e2e` sobe um
  encaminhador de portas em Node, de `localhost:3000` para `web:3000` e de `localhost:3001` para
  `chat-api:3000`, e o `BASE_URL` passa a `http://localhost:3000`. Assim o navegador do teste
  enxerga os mesmos endereços que o da máquina, e o `CHAT_API_PUBLIC_URL` e o `WEB_ORIGIN` têm um
  valor só.
- **Reconexão depois de outro erro de handshake.** O cliente do Socket.IO desiste depois de um
  `connect_error`. Para outros erros que não `unauthenticated`, o provedor chama `connect()` de novo
  depois de 1 s a 5 s, crescendo como a reconexão padrão.

## Arquivos e interfaces

- `packages/chat-events/package.json` e `packages/chat-events/index.d.ts`: os tipos dos eventos.
- `apps/chat-api/package.json` e `apps/web/package.json`: `chat-events`, `socket.io`,
  `@nestjs/websockets` e `@nestjs/platform-socket.io` na API; `socket.io-client` na web e, para os
  testes, na API.
- `apps/chat-api/src/config/env.schema.ts`: `WEB_ORIGIN` (URL obrigatória).
- `apps/chat-api/src/realtime/`: `RealtimeModule`, `RealtimeGateway` (conexão e salas),
  `ChatIoAdapter` (opções do servidor) e o middleware de autenticação.
- `apps/chat-api/src/app.setup.ts`: `configureApp` passa a instalar o `ChatIoAdapter`.
- `apps/chat-api/test/support/`: `listenTestApp()` e `realtimeRoutes.connect()`.
- `apps/web/src/app/config/env.ts`: `CHAT_API_PUBLIC_URL`.
- `apps/web/src/app/components/realtime/realtime-provider.tsx`: o provedor (`"use client"`), com o
  hook `useRealtime()` que expõe o estado da conexão e o socket tipado.
- `apps/web/src/app/(app)/layout.tsx`: o provedor envolve a Casca, com o endereço lido no servidor.
- `apps/web/e2e/support/port-forward.mjs`, `apps/web/e2e/fixtures.ts` (segunda Pessoa e o atalho de
  entrar num contexto novo) e `apps/web/playwright.config.ts` (`baseURL`).
- `compose.yaml`: `WEB_ORIGIN` na `chat-api`, `CHAT_API_PUBLIC_URL` na `web`, o encaminhador e o
  `BASE_URL` no `e2e`.
- `apps/web/next.config.ts`: `allowedDevOrigins` deixa de precisar de `web`.

## Testes existentes que mudam

Nenhum muda de comportamento. Os testes do Playwright passam a abrir a web por
`http://localhost:3000`, pelo encaminhador, e os cookies ficam em `localhost`, como na máquina.

## Mudança de dados

Nenhuma.

## Documentos atualizados

- `docs/lld.md`, seção "Ambiente de desenvolvimento": o contêiner `e2e` abre a web e a API por
  `localhost`, com o encaminhador de portas, e o motivo.
- `docs/lld.md`, seção "Conceitos transversais de implementação", "Segurança" (CSRF): a origem do
  handshake é conferida no `allowRequest`, porque o transporte `websocket` não passa por CORS.
