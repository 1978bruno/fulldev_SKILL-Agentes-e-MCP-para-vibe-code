# Plano da F01-T08: Limite de tentativas de login

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** revisão humana

**Cenário:** Dado o diff, quando quem revisa abre `apps/chat-api/migrations/`, então encontra a
migração gerada pelo TypeORM com `login_attempts` nas colunas e restrições do contrato abaixo.

### CA2

**Marca:** teste HTTP

**Cenário 1:** Dado uma Pessoa, quando ela erra a senha 5 vezes seguidas, então as 4 primeiras e a
5ª respondem 401 `invalid_credentials` e a 6ª, com a senha certa, responde 429.

**Cenário 2:** Dado um e-mail sem conta, quando recebe 5 falhas, então a 6ª tentativa responde 429.

**Cenário 3:** Dado entrada inválida (senha vazia), quando enviada 6 vezes, então todas respondem
400 e não existe linha de tentativas para o e-mail.

**Cenário 4:** Dado 4 falhas com o `first_failed_at` envelhecido para além da janela, quando vem a
5ª falha, então ela responde 401 e a contagem recomeça em 1.

**Teste previsto:** e2e da API, `test/login-attempts.e2e-spec.ts`, um caso por cenário.

### CA3

**Marca:** teste HTTP

**Cenário 1:** Dado um e-mail bloqueado, quando a Pessoa tenta com a senha certa, então recebe 429
`too_many_login_attempts` com `Retry-After` entre 1 e 900 segundos.

**Cenário 2:** Dado um e-mail bloqueado, quando recebe mais 3 tentativas, então `blocked_until` e
`failed_count` não mudam.

**Cenário 3:** Dado um e-mail bloqueado, quando recebe uma tentativa, então sai um log `warn` sem o
e-mail completo nem a senha.

**Cenário 4:** Dado um bloqueio com `blocked_until` envelhecido para o passado, quando a Pessoa
entra com a senha certa, então recebe 201.

**Teste previsto:** e2e da API, `test/login-attempts.e2e-spec.ts`. O log é provado por um espião
em `Logger.prototype.warn`, que é o próprio efeito (`.claude/rules/nest-api-testing.md`).

### CA4

**Marca:** teste HTTP

**Cenário 1:** Dado 4 falhas, quando a Pessoa entra com a senha certa, então recebe 201 e a linha de
tentativas deixa de existir.

**Cenário 2:** Dado um e-mail sem falhas, quando duas falhas chegam ao mesmo tempo, então
`failed_count` é 2.

**Teste previsto:** e2e da API, `test/login-attempts.e2e-spec.ts`.

### CA5

**Marca:** teste no Playwright

**Cenário:** Dado uma Pessoa que errou a senha 5 vezes, quando tenta de novo, então vê "Muitas
tentativas de entrar. Aguarde alguns minutos e tente de novo." no `alert` do formulário, com o
E-mail e a Senha ainda preenchidos.

**Teste previsto:** Playwright, `e2e/login/tentativas-demais.spec.ts` (o mesmo do CA8).

### CA6

**Marca:** revisão humana

**Cenário:** Dado o arquivo do Figma, seção Login, quando quem revisa procura "Login / Tentativas
demais" (nó 86:54), então encontra o frame feito das instâncias e variables locais, criado antes
do código da mensagem; e a validação visual mostra a tela igual a ele.

### CA7

**Marca:** revisão humana

**Cenário:** Dado o diff, quando quem revisa abre `test/login-attempts.e2e-spec.ts` e
`test/support/aging-routes.ts`, então os testes de CA2 a CA4 envelhecem as tentativas pelo atalho
`ageLoginAttempts`, sem relógio falso.

### CA8

**Marca:** teste no Playwright

**Cenário:** o mesmo do CA5. A validação visual do estado, nos dois temas, fica em
`validacao-visual.md`.

**Teste previsto:** Playwright, `e2e/login/tentativas-demais.spec.ts`.

## Contrato

### login_attempts · chat · nova

| Coluna | Tipo | Nulo | Padrão | Observação |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | não | — | UUID v7 |
| `email` | `text` | não | — | Normalizado |
| `failed_count` | `integer` | não | — | Falhas dentro da janela |
| `first_failed_at` | `timestamptz` | não | — | Início da janela |
| `blocked_until` | `timestamptz` | sim | — | Fim do bloqueio; nulo fora dele |
| `created_at` | `timestamptz` | não | `now()` | |
| `updated_at` | `timestamptz` | não | `now()` | |

- Chave primária: `id`. Única: `email`.

### POST /v1/sessions · alterada

| Item | Antes | Depois |
| --- | --- | --- |
| Erros | 400 `validation_failed`; 401 `invalid_credentials` | Mais 429 `too_many_login_attempts` |
| Cabeçalhos de resposta | Nenhum | `Retry-After` (segundos) no 429 |

## Verificação do contrato

- `login_attempts`, única em `email`: CA4, cenário 2 (o upsert concorrente depende dela).
- `POST /v1/sessions` 429 com `Retry-After`: CA3, cenário 1.

## Decisões

- **Módulo:** `login-attempts`, com a entidade e o `LoginAttemptsService` (`assertNotBlocked`,
  `recordFailure`, `clear`), usado pelo `SessionsService.login` nesta ordem: e-mail normalizado,
  `assertNotBlocked`, conferência da senha, `recordFailure` ou `clear`.
- **Upsert atômico:** `recordFailure` é um `INSERT ... ON CONFLICT (email) DO UPDATE` só com
  expressões do próprio `UPDATE` (recomeça a contagem quando a janela venceu, soma 1 quando não, e
  grava `blocked_until` quando a soma chega a `tentativas de login`), com
  `WHERE blocked_until IS NULL OR blocked_until <= now()`, para uma falha que corre com o bloqueio
  não o estender. O relógio é o `now()` do banco nas duas pontas.
- **Valores:** `tentativas de login`, `janela de tentativas de login` e `bloqueio do login` são
  constantes do módulo, com os valores do LLD ("Valores e configuração").
- **Erro:** `TooManyLoginAttemptsError`, com `retryAfterSeconds`. O `DomainError` ganha o campo
  opcional `retryAfterSeconds`, e o filter o traduz no cabeçalho `Retry-After`, sem conhecer o
  erro concreto.
- **Log:** `warn` "Tentativa de login bloqueada", com o e-mail mascarado (primeira letra, `***` e o
  domínio).
- **Web:** o service HTTP devolve `too_many_attempts` no 429; o Server Action devolve o estado
  `too_many_attempts`; o formulário mostra a mensagem no `alert` da T04, sem mexer nos campos.
- **Atalho de tempo:** `test/support/aging-routes.ts` ganha `ageLoginAttempts(app, email,
  { firstFailedAt, blockedUntil })`.

## Arquivos e interfaces

- API: `src/login-attempts/{login-attempt.entity,login-attempts.service,login-attempts.module,too-many-login-attempts.error}.ts`;
  `src/sessions/sessions.service.ts`, `src/sessions/sessions.module.ts`;
  `src/common/errors/{domain.error,error-code,problem-details.filter}.ts`;
  `migrations/<timestamp>-CreateLoginAttempts.ts`; `test/login-attempts.e2e-spec.ts`,
  `test/support/aging-routes.ts`.
- Web: `src/app/services/chat-api.ts`, `src/app/actions/login.ts`,
  `src/app/components/auth/login-form.tsx`; `e2e/login/tentativas-demais.spec.ts`,
  `e2e/plano-de-testes-f01.md`.

## Testes existentes que mudam

Nenhum. Os testes de login que erram a senha usam e-mails únicos e erram menos de 5 vezes.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum: as regras já estão no LLD ("Sessão e login", "Limite de tentativas") e na ADR 0023.
