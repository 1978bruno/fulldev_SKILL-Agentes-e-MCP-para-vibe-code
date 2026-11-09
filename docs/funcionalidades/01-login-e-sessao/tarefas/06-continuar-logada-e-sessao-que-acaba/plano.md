# Plano da F01-T06: Continuar logada, e Sessão que vence ou é revogada

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste HTTP

**Cenário 1:** Dado uma Sessão cujo `last_used_at` foi envelhecido em 2 dias, quando
`GET /v1/sessions/current` a recebe, então responde 200, `expires_at` passa a ser agora mais a
`duração da Sessão` (com tolerância de alguns segundos) e `last_used_at` passa a ser agora.

**Cenário 2:** Dado uma Sessão recém-criada, com `last_used_at` de agora, quando é verificada,
então `expires_at` e `last_used_at` não mudam.

**Teste previsto:** e2e da API, `test/sessions.e2e-spec.ts`, "renova a validade quando passou o
intervalo de renovação" e "não renova antes do intervalo de renovação".

### CA2

**Marca:** teste HTTP

**Cenário:** Dado uma Sessão com `expires_at` no passado, quando é verificada, então responde 401
`unauthenticated` e a linha deixa de existir.

**Teste previsto:** e2e da API, `test/sessions.e2e-spec.ts`, "responde 401 e apaga a Sessão
vencida".

### CA3

**Marca:** teste de integração

**Cenário 1:** Dado uma Pessoa com duas Sessões, quando `revoke-sessions <e-mail>` roda, então as
duas deixam de existir e o comando termina com sucesso.

**Cenário 2:** Dado uma Pessoa com uma Sessão, quando `reset-password <e-mail>` roda com a senha nova
dada, então a senha nova confere com o hash, a antiga não confere e a Sessão deixa de existir.

**Cenário 3:** Dado uma Sessão vencida e uma válida, quando `purge-expired-sessions` roda, então só a
vencida deixa de existir.

**Teste previsto:** integração, `src/accounts/accounts.command.int-spec.ts`, um caso por cenário,
mais "recusa operação com e-mail sem conta" para `revoke-sessions` e `reset-password`.

### CA4

**Marca:** revisão humana

**Cenário:** Dado o diff, quando quem revisa abre `src/config/env.schema.ts` e o
`SessionsService`, então encontra `SESSION_TTL_DAYS` com padrão 30 (entrou na T03, que gravava
`expires_at`) e o `intervalo de renovação da Sessão` como constante de 1 dia.

### CA5

**Marca:** revisão humana

**Cenário:** Dado o diff, quando quem revisa abre `test/support/`, então encontra os atalhos de
envelhecer a Sessão (`agingRoutes.ageSession`), usados nos testes do CA1 e do CA2, sem relógio
falso e sem `overrideProvider`; e o teste de integração do comando cobre o CA3.

### CA6

**Marca:** teste no Playwright

**Cenário 1:** Dado uma Pessoa logada numa página, quando outra página do mesmo contexto abre `/`,
então está logada.

**Cenário 2:** Dado uma Pessoa logada, quando o estado do navegador é salvo e um contexto novo é
aberto com ele, então `/` mostra a Home.

**Cenário 3:** Dado uma Pessoa logada, quando a Sessão dela é apagada no banco e ela navega para `/`
de novo, então vai para "Entrar".

**Teste previsto:** Playwright, `e2e/sessao/segunda-aba-ja-logada.spec.ts`,
`e2e/sessao/navegador-reaberto-continua-logado.spec.ts` e
`e2e/sessao/sessao-revogada-volta-para-entrar.spec.ts`.

## Contrato

### GET /v1/sessions/current · alterada

Só o comportamento muda (renovação e exclusão da vencida); a forma da rota é a mesma.

## Verificação do contrato

- `GET /v1/sessions/current`, renovação: CA1. 401 da vencida: CA2.

## Decisões

- **Renovação:** no `SessionsService.authenticate`, depois de achar a Sessão válida, um `UPDATE`
  condicional (`WHERE id = $1 AND last_used_at <= now() - interval`) grava `expires_at` e
  `last_used_at`. Motivo: duas abas verificando ao mesmo tempo geram no máximo uma escrita útil, e
  antes do intervalo nada é gravado.
- **Vencida:** `DELETE` da linha quando `expires_at <= agora`, e então `UnauthenticatedError`.
- **Operações novas do comando:** o `AccountsModule` passa a importar o `SessionsModule`; o
  `SessionsService` ganha `revokeAll(personId)` e `purgeExpired()`, e o `PeopleService` ganha
  `changePassword(personId, password)`. O `reset-password` é um método do `AccountsCommand` que chama os
  dois services, primeiro a revogação e depois a troca da senha: uma falha entre as duas escritas
  deixa a Pessoa sem Sessões e com a senha antiga, e nunca a senha nova com Sessões antigas. Não há
  transação entre os módulos porque o LLD ainda deixa "onde a transação começa" a definir.
- **Atalhos de tempo:** `test/support/aging-routes.ts`, com `ageSession(app, token, { lastUsedAt,
  expiresAt })`, que grava as datas direto pelo `DataSource`; no Playwright,
  `e2e/support/database.ts` ganha `deleteSessionsOf(personId)`.

## Arquivos e interfaces

- `apps/chat-api/src/sessions/sessions.service.ts`: renovação, exclusão da vencida, `revokeAll`,
  `purgeExpired`.
- `apps/chat-api/src/people/people.service.ts`: `changePassword`.
- `apps/chat-api/src/accounts/*`: as três operações e o import do `SessionsModule`.
- `apps/chat-api/test/support/aging-routes.ts`, `test/sessions.e2e-spec.ts`,
  `src/accounts/accounts.command.int-spec.ts`.
- `apps/chat-api/AGENTS.md`: as operações novas na tabela de comandos.
- `apps/web/e2e/support/database.ts`, `apps/web/e2e/sessao/*.spec.ts`, `e2e/plano-de-testes-f01.md`.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum: as regras de renovação, vencimento e revogação já estão no LLD ("Sessão e login").
