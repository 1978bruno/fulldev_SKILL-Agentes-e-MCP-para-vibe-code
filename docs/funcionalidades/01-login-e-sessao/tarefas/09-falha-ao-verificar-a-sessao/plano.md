# Plano da F01-T09: Falha ao verificar a Sessão

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** revisão humana

**Cenário:** Dado a API do chat congelada (processo parado com `SIGSTOP`, para a verificação
esperar o tempo limite), quando a Pessoa logada abre `/`, então vê "Portas / Carregando o app",
com o spinner centralizado, até a verificação terminar. A captura fica na validação visual (CA5);
o componente é o `fallback` do `<Suspense>` do layout logado.

### CA2

**Marca:** revisão humana

**Cenário:** Dado a API do chat parada, quando a Pessoa logada abre `/`, então vê "Portas / Erro de
sessão" em tela cheia, sem o Rail nem a Sidebar, com o título e o texto do Figma e o botão "Tentar
de novo"; a URL continua `/` e o cookie continua no navegador. Verificado pelo agente com o
`playwright-cli` (CA4).

### CA3

**Marca:** revisão humana

**Cenário:** Dado a tela de erro do CA2, quando a API volta e a Pessoa clica em "Tentar de novo",
então vê a Home; dado a tela de erro e a Sessão revogada antes do clique, quando a API volta e a
Pessoa clica em "Tentar de novo", então vai para "Entrar". Verificado pelo agente com o
`playwright-cli` (CA4).

### CA4

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quando quem revisa abre `erro-de-sessao.md`, então encontra
os passos do `playwright-cli` (API parada, tela logada, mensagem e botão, API de volta, "Tentar de
novo"), o snapshot e a captura de cada etapa.

### CA5

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quando quem revisa abre `validacao-visual.md`, então
encontra "Erro de sessão" e "Carregando o app" nos dois temas, ao lado dos frames 19:1793 e
19:1770 do Figma.

## Contrato

### GET /api/session/expired · BFF · alterada

| Item | Antes | Depois |
| --- | --- | --- |
| Resposta | Apaga o cookie e vai para `/entrar` em qualquer resultado que não seja 200 | Apaga o cookie só com 401 (ou sem cookie); com falha de rede, 5xx ou tempo esgotado, volta para o caminho pedido sem apagar o cookie |

## Verificação do contrato

- `GET /api/session/expired` sem apagar o cookie na falha: CA2 (o cookie continua) e a revisão do
  código da rota.

## Decisões

- **Layout logado:** o `AuthenticatedShell` passa a tratar os três resultados: `ok` mostra o shell;
  `unauthenticated` redireciona à rota do BFF; `failure` mostra a `SessionError`, sem o shell.
- **Carregando:** `AppLoading` em `src/app/components/session/app-loading.tsx`, o frame "Portas /
  Carregando o app" (19:1770), como `fallback` do `<Suspense>`.
- **Erro:** `SessionError` em `src/app/components/session/session-error.tsx` (`"use client"`), o
  frame "Portas / Erro de sessão" (19:1793); "Tentar de novo" chama `router.refresh()`, que refaz a
  renderização da rota e, com ela, a verificação no layout.
- **Rota do BFF:** `GET /api/session/expired` só apaga o cookie quando a API responde 401 ou não há
  cookie; na falha, redireciona ao caminho pedido, que volta a cair no layout e mostra o erro.
- **Verificação com a API congelada:** para a captura de "Carregando o app", o agente congela o
  processo da API com `kill -STOP` e o retoma com `kill -CONT`; a verificação espera o tempo limite
  de 5 s do service HTTP, e a tela de carregamento fica visível nesse intervalo.

## Arquivos e interfaces

- `apps/web/src/app/(app)/layout.tsx`: os três resultados.
- `apps/web/src/app/components/session/app-loading.tsx`, `session-error.tsx`.
- `apps/web/src/app/api/session/expired/route.ts`: só apaga com 401.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum: o comportamento já está no LLD ("Cliente", "Sessão no cliente").
