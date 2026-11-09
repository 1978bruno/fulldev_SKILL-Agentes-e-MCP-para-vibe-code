# 01: Conexão em tempo real autenticada

**Status:** a fazer

**O que construir:** cada aba logada abre um WebSocket direto na API do chat e fica conectada
enquanto a Pessoa troca de Conversa. Sem Sessão, ou de outra origem, a conexão é recusada e a aba
vai para "Entrar". É a base das outras tarefas da F03: o contrato dos eventos, o provedor de conexão
na web e as bases de teste com vários sockets e duas Pessoas. Referências:
- spec da F03, "Conexão", "Sessão no WebSocket" (handshake), "Eventos" e "Cliente" ("Endereço" e
  "Conexão por aba");
- LLD, "Sessão e login" ("WebSocket"), "Cliente" ("Sessão no cliente") e "Valores e configuração";
- ADRs 0002, 0017 e 0019.

**Bloqueada por:** Nenhuma (pode começar imediatamente)

- [ ] **CA1** · O pacote `chat-events` existe, só com tipos, ligado ao `web` e à `chat-api` por
  `file:`, com os eventos da tabela da spec. A estrutura do código do LLD passa o pacote a `existe`.
- [ ] **CA2** · O gateway Socket.IO roda no mesmo servidor da API, só pelo transporte `websocket`,
  com CORS por `WEB_ORIGIN` e credenciais. `WEB_ORIGIN` entra no schema de configuração e no compose.
- [ ] **CA3** · O handshake verifica a Sessão pelo mesmo `authenticate` do guard REST e põe o socket
  nas salas `person:<id>` e `session:<id>`. Sem cookie ou com Sessão vencida, a recusa é
  `unauthenticated`; de outra origem, é recusado.
- [ ] **CA4** · Um provedor cliente no layout logado abre um socket por aba, com o endereço de
  `CHAT_API_PUBLIC_URL`, lido no servidor, e o mantém entre as trocas de Conversa. Ele expõe o
  estado da conexão (conectando, conectada, desconectada) e a assinatura de eventos para as outras
  tarefas.
- [ ] **CA5** · `connect_error` com `unauthenticated` leva a `GET /api/session/expired` com o
  `?para=` da página atual. Outra falha de handshake chama `connect()` de novo com o intervalo da
  reconexão.
- [ ] **CA6** · A base de testes da API sobe o servidor em `127.0.0.1` numa porta livre e conecta
  sockets de várias Pessoas com cookie, e os testes de ponta a ponta provam CA3. Essa base também
  serve à medição das tarefas 02 e 04.
- [ ] **CA7** · A base do Playwright abre duas Pessoas em contextos separados no mesmo Canal, e um
  teste prova que, sem Sessão, a aba vai para "Entrar".
