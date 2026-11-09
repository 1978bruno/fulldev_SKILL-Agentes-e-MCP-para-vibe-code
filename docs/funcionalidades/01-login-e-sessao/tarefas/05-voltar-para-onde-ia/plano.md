# Plano da F01-T05: Voltar para onde ia

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste no Playwright

**Cenário 1:** Dado um navegador sem cookie, quando abre `/canais/geral?aba=fixados`, então vai
para `/entrar?para=%2Fcanais%2Fgeral%3Faba%3Dfixados`.

**Cenário 2:** Dado um cookie de sessão que a API não reconhece, quando abre
`/canais/geral?aba=fixados`, então vai para `/entrar` com o mesmo `para` e sem o cookie.

**Teste previsto:** Playwright, `e2e/login/entrar-por-link-profundo.spec.ts` (cenário 1, no
começo do fluxo) e `e2e/login/sessao-desconhecida-volta-para-entrar.spec.ts` (cenário 2, que
passa a abrir um caminho com busca).

### CA2

**Marca:** teste no Playwright

**Cenário 1:** Dado a Pessoa levada a "Entrar" a partir de `/canais/geral?aba=fixados`, quando
entra, então cai em `/canais/geral?aba=fixados`.

**Cenário 2:** Dado `/entrar?para=//outro-site` e, em outro caso, `/entrar?para=https://outro-site`,
quando a Pessoa entra, então cai em `/`.

**Teste previsto:** Playwright, `e2e/login/entrar-por-link-profundo.spec.ts` e
`e2e/login/para-externo-cai-na-home.spec.ts` (os dois valores). O caminho `/canais/geral` ainda
não existe na F01: a Pessoa cai nele e vê o 404 dentro do shell, o que basta para provar o
destino.

### CA3

**Marca:** teste no Playwright

**Cenário 1:** Dado uma Pessoa logada, quando abre `/entrar`, então vai para `/`.

**Cenário 2:** Dado um cookie de sessão que a API não reconhece, quando abre `/entrar`, então vê o
formulário e o cookie deixa de existir.

**Teste previsto:** Playwright, `e2e/login/logada-em-entrar-vai-para-a-home.spec.ts` e
`e2e/login/sessao-desconhecida-em-entrar-mostra-o-formulario.spec.ts`.

### CA4

**Marca:** revisão humana

**Cenário:** Dado o diff, quando quem revisa abre os testes do CA1 ao CA3, então encontra o link
profundo, os dois valores externos de `para` e a Pessoa logada abrindo `/entrar`, como pede a
tarefa.

## Contrato

### GET /api/session/expired · BFF · alterada

| Item | Antes | Depois |
| --- | --- | --- |
| Parâmetros de consulta | Nenhum | `para` (opcional): o caminho pedido |
| Resposta | 307 para `/entrar` ou `/` | 307 para `/entrar?para=<para>`, quando `para` é um caminho seguro, ou `/entrar`; com 200 da API, para `para` seguro ou `/` |

## Verificação do contrato

- `GET /api/session/expired` com `para`: CA1, cenário 2, e CA3, cenário 2.

## Decisões

- **Caminho seguro:** `safeReturnPath(value)`, função pura em `src/app/utils/return-path.ts`.
  Aceita só texto que começa com `/` e cujo segundo caractere não é `/` nem `\`; qualquer outro
  valor vira `/`. A barra invertida entra porque o navegador trata `/\outro-site` como `//`: é a
  mesma regra do LLD ("Voltar para onde ia"), fechando a variante.
- **Caminho pedido no layout:** o proxy repassa o caminho com a busca num cabeçalho da requisição,
  `x-fc-path`, que o layout logado lê com `headers()` para montar o `para`. Motivo: o Server
  Component não recebe a URL, e o proxy já roda em toda tela logada.
- **`para` no formulário:** a página `/entrar` lê `searchParams.para` e o passa ao `LoginForm`,
  que o envia num campo escondido; o Server Action o passa por `safeReturnPath` antes do
  `redirect`.
- **`/entrar` com cookie:** a página verifica a Sessão na API, dentro de um `<Suspense>`. Com 200,
  `redirect('/')`; com 401, redireciona a `/api/session/expired?para=...`, que apaga o cookie e
  volta a `/entrar`, agora sem cookie; com falha de rede ou 5xx, mostra o formulário sem apagar o
  cookie.

## Arquivos e interfaces

- `apps/web/src/app/utils/return-path.ts`: `safeReturnPath`.
- `apps/web/src/proxy.ts`: `para` no redirecionamento e o cabeçalho `x-fc-path`.
- `apps/web/src/app/(app)/layout.tsx`: `para` no caminho do 401.
- `apps/web/src/app/api/session/expired/route.ts`: lê e repassa `para`.
- `apps/web/src/app/entrar/page.tsx`: verificação com cookie e o `para`.
- `apps/web/src/app/components/auth/login-form.tsx`, `apps/web/src/app/actions/login.ts`: campo
  `para` e o destino depois de entrar.
- Testes do Playwright citados nos critérios e o `e2e/plano-de-testes-f01.md`.

## Testes existentes que mudam

- `e2e/login/sessao-desconhecida-volta-para-entrar.spec.ts` e
  `e2e/login/redireciona-sem-sessao.spec.ts`: a URL esperada passa a ter `para`.

## Mudança de dados

Nenhuma.

## Documentos atualizados

- `docs/lld.md`, "Cliente", "Sessão no cliente" ("Voltar para onde ia"): a barra invertida no
  segundo caractere também é recusada.
