# Plano da F03-T06: Sessão que acabou encerra o tempo real

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste HTTP

**Cenário:** Dada uma Pessoa com duas Sessões, cada uma com um socket conectado, quando ela sai por
`DELETE /v1/sessions/current` com a primeira, então o socket da primeira recebe `session.ended` e é
desconectado na hora, e o da segunda continua conectado.

**Teste previsto:** e2e da API, `test/realtime-session.e2e-spec.ts`, "sair desconecta os sockets da
Sessão, e só os dela".

### CA2

**Marca:** teste HTTP

**Cenário:**
- Dado um socket conectado cuja Sessão foi revogada (a linha apagada) ou venceu, quando a
  reconferência periódica roda, então o socket recebe `session.ended` e é desconectado.
- Dado um socket cuja Sessão vale e passou do `intervalo de renovação da Sessão` sem uso, quando a
  reconferência roda, então a Sessão é renovada (`last_used_at` e `expires_at` avançam) e o socket
  continua conectado.

**Teste previsto:** e2e da API, `test/realtime-session.e2e-spec.ts`, "a reconferência desconecta a
Sessão revogada", "a reconferência desconecta a Sessão vencida" e "a reconferência renova a Sessão
que vale". O teste chama a reconferência direto pelo gateway, em vez de esperar o intervalo.

### CA3

**Marca:** teste no Playwright

**Cenário:** Dada uma aba com o tempo real, quando chega `session.ended` ou o servidor desconecta o
socket, então a aba vai para `GET /api/session/expired` com o `?para=` da página atual.

**Teste previsto:** Playwright, `e2e/tempo-real/sair-em-outra-aba.spec.ts` (CA5), que passa pelo
`session.ended`.

### CA4

**Marca:** teste HTTP

**Cenário:** Os testes de CA1 e CA2, com a reconferência chamada direto.

**Teste previsto:** os mesmos.

### CA5

**Marca:** teste no Playwright

**Cenário:** Dadas duas abas da mesma Sessão com um Canal aberto, quando a Pessoa sai por uma, então
a outra vai para "Entrar" sem navegar, com o `?para=` do Canal.

**Teste previsto:** Playwright, `e2e/tempo-real/sair-em-outra-aba.spec.ts`, "sair numa aba leva a
outra a Entrar".

## Contrato

### session.ended · servidor → cliente · novo

| Item | O que descreve |
| --- | --- |
| Quem recebe | Os sockets da sala `session:<id>` da Sessão que acabou: pelo sair, na hora; pela reconferência, o socket reconferido |
| Autenticação | A da conexão |
| Carga | Nenhuma |
| Confirmação | Nenhuma |
| Erros | Nenhum. Logo depois, o servidor desconecta o socket |

O contrato HTTP não muda: `DELETE /v1/sessions/current` continua com 204.

## Verificação do contrato

- `session.ended` e a desconexão ao sair, só da Sessão: CA1.
- `session.ended` e a desconexão na reconferência: CA2.

## Decisões

- **O sair avisa por um ouvinte no `SessionsService`.** O módulo `realtime` importa o de sessões, e
  o contrário seria um ciclo. Por isso o `SessionsService` ganha `onSessionEnded(listener)`, que o
  gateway assina no `afterInit`, e o `logout` avisa os ouvintes depois de apagar a Sessão. O gateway
  emite `session.ended` para a sala `session:<id>` e desconecta os sockets dela.
- **A reconferência é um método do gateway.** O handshake guarda o token em `socket.data`. Um timer
  único, a cada `intervalo de reconferência da Sessão no WebSocket` (60 s, constante em
  `realtime-values.ts`), chama `recheckSessions()`, que passa por todos os sockets e chama o
  `authenticate` de cada um. `unauthenticated` emite `session.ended` e desconecta; outra falha (o
  banco fora) mantém o socket e tenta de novo na próxima volta. O teste chama o método direto.
- **No cliente**, o provedor trata `session.ended` e a desconexão com o motivo
  `io server disconnect` levando a `GET /api/session/expired`, como os 401 do REST.

## Arquivos e interfaces

- `apps/chat-api/src/sessions/sessions.service.ts`: `onSessionEnded(listener)` e o aviso no `logout`.
- `apps/chat-api/src/realtime/realtime.gateway.ts`: o token em `socket.data`, a assinatura do aviso,
  o timer e `recheckSessions()`.
- `apps/chat-api/src/realtime/realtime-values.ts`: `SESSION_RECHECK_INTERVAL_MS`.
- `apps/chat-api/test/realtime-session.e2e-spec.ts`.
- `apps/web/src/app/components/realtime/realtime-provider.tsx`: `session.ended` e a desconexão pelo
  servidor.
- `apps/web/e2e/tempo-real/sair-em-outra-aba.spec.ts`.

## Testes existentes que mudam

Nenhum. O teste da F01 "outra-aba-vai-para-entrar" continua passando: a aba na Home vazia também
recebe `session.ended` e vai para "Entrar".

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum. As regras estão no LLD, "Sessão e login", "WebSocket".
