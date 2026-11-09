# Plano da F01-T07: Sair

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste HTTP

**Cenário 1:** Dado uma Pessoa com duas Sessões, quando `DELETE /v1/sessions/current` recebe o
cookie da primeira, então responde 204, a primeira passa a responder 401 em
`GET /v1/sessions/current` e a segunda continua respondendo 200.

**Cenário 2:** Dado nenhum cookie, quando `DELETE /v1/sessions/current` é chamada, então responde 401
`unauthenticated`.

**Teste previsto:** e2e da API, `test/sessions.e2e-spec.ts`, "responde 204 e apaga só a Sessão
apresentada" e "responde 401 unauthenticated ao sair sem Sessão".

### CA2

**Marca:** teste no Playwright

**Cenário:** Dado uma Pessoa logada na Home, quando ela foca o avatar do Rail pelo teclado e aperta
Enter, então o menu abre com o nome dela no cabeçalho e um único item, "Sair do Full Cycle"; Esc
fecha o menu e devolve o foco ao avatar; um clique no avatar abre o menu de novo. A fidelidade ao
frame da Casca (25:25749) fica na validação visual do CA7.

**Teste previsto:** Playwright, `e2e/sair/menu-do-avatar.spec.ts`.

### CA3

**Marca:** teste no Playwright

**Cenário 1:** Dado o menu aberto, quando a Pessoa escolhe "Sair do Full Cycle", então vai para
`/entrar`, o cookie deixa de existir e a Sessão dela não existe mais no banco.

**Cenário 2:** Dado a API do chat recusando a saída (a Sessão já foi apagada no banco antes do
clique), quando a Pessoa escolhe "Sair do Full Cycle", então vai para `/entrar` e o cookie deixa de
existir do mesmo jeito.

**Teste previsto:** Playwright, `e2e/sair/sair-pelo-teclado.spec.ts` (cenário 1, com o teclado do
CA6) e `e2e/sair/sair-com-a-api-recusando.spec.ts` (cenário 2).

### CA4

**Marca:** teste no Playwright

**Cenário:** Dado uma Pessoa que saiu, quando volta pelo histórico, então não vê a Home e está em
"Entrar". O cabeçalho `Cache-Control: no-store` das telas logadas é conferido no mesmo teste, na
resposta de `/`, e o recarregamento no `pageshow` com `persisted` é conferido por quem revisa.

**Teste previsto:** Playwright, `e2e/sair/voltar-depois-de-sair.spec.ts`.

### CA5

**Marca:** revisão humana

**Cenário:** Dado o diff, quando quem revisa abre `test/sessions.e2e-spec.ts`, então encontra os
testes do CA1.

### CA6

**Marca:** teste no Playwright

**Cenário 1:** Dado uma Pessoa logada, quando sai só pelo teclado (Tab até o avatar, Enter, setas e
Enter no item), então vai para "Entrar".

**Cenário 2:** Dado uma Pessoa logada em duas páginas do mesmo contexto, quando sai numa, então a
outra vai para "Entrar" na próxima navegação.

**Teste previsto:** Playwright, `e2e/sair/sair-pelo-teclado.spec.ts` e
`e2e/sair/outra-aba-vai-para-entrar.spec.ts`; o voltar pelo histórico está no CA4.

### CA7

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quando quem revisa abre `validacao-visual.md`, então
encontra o menu aberto nos dois temas, ao lado do frame da Casca no Figma.

## Contrato

### DELETE /v1/sessions/current · nova

| Item | Valor |
| --- | --- |
| Autenticação | Cookie de Sessão (`AuthGuard`) |
| Resposta de sucesso | 204, sem corpo |
| Erros | 401 `unauthenticated` |

## Verificação do contrato

- `DELETE /v1/sessions/current` 204: CA1, cenário 1. 401: CA1, cenário 2.

## Decisões

- **Sessão apresentada:** o `AuthGuard` passa a guardar na requisição também o id da Sessão; o
  controller chama `SessionsService.logout(sessionId)`, que apaga a linha.
- **Menu:** `UserMenu` em `src/app/components/user/user-menu.tsx` (`"use client"`), com o
  `DropdownMenu` do pacote `radix-ui`; o gatilho é o avatar do Rail, num `<button>` com
  `aria-label` "Menu de Ana Souza" (o nome da Pessoa). O item usa os estilos do
  `DropdownMenuItem` do design system (`h-8`, destacado com `sidebar-active`).
- **Sair:** Server Action `logout` em `src/app/actions/logout.ts`, chamado pelo item do menu; chama
  `chatApi.logout(token)` (`DELETE /v1/sessions/current`), apaga o cookie em qualquer resultado e
  faz `redirect('/entrar')`.
- **`no-store`:** o proxy acrescenta `Cache-Control: no-store` à resposta de toda tela logada (as
  rotas que ele já intercepta). Motivo: um lugar só, antes de qualquer renderização.
- **`pageshow`:** um componente cliente pequeno, `BfcacheReload`, no layout logado, que chama
  `location.reload()` quando o evento vem com `persisted`.

## Arquivos e interfaces

- API: `src/sessions/{auth.guard,sessions.controller,sessions.service,current-person.decorator}.ts`;
  `test/sessions.e2e-spec.ts`.
- Web: `src/app/services/chat-api.ts` (`logout`); `src/app/actions/logout.ts`;
  `src/app/components/user/user-menu.tsx`; `src/app/components/ui/dropdown-menu.tsx`;
  `src/app/components/workspace-nav/rail.tsx`; `src/app/components/bfcache-reload.tsx`;
  `src/app/(app)/layout.tsx`; `src/proxy.ts`; `package.json` (`radix-ui`);
  `e2e/sair/*.spec.ts`, `e2e/support/database.ts`, `e2e/plano-de-testes-f01.md`.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

- `docs/design-system.md`, "Stack de interface": `radix-ui` passa a instalado.
