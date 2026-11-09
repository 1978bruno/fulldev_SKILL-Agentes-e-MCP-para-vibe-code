# Plano da F01-T02: Base da web e dos testes de ponta a ponta

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** revisão humana

**Cenário:** Dado o diff da tarefa, quando quem revisa abre `apps/web/src/app/config/env.ts`,
então encontra o schema zod com `CHAT_API_URL`, `SESSION_COOKIE_NAME`, `SESSION_COOKIE_DOMAIN` e
`SESSION_COOKIE_SECURE`, lido uma vez no carregamento do módulo e exportado já tipado; e o
`src/instrumentation.ts` importando esse módulo na subida do servidor. No contêiner `web`, rodar
`env -u CHAT_API_URL pnpm dev --hostname 0.0.0.0 --port 3999` termina com código diferente de zero
e a mensagem traz `CHAT_API_URL`. A regra "nenhum outro arquivo lê `process.env`" é imposta pelo
lint (ver "Decisões").

### CA2

**Marca:** revisão humana

**Cenário:** Dado o diff da tarefa, quando quem revisa abre `apps/web/src/app/globals.css` e o
`layout.tsx`, então encontra todos os tokens de `docs/design-system.md` ("Cores semânticas",
"Tipografia", "Raios", "Tamanhos do shell", "Movimento" e o foco global), o bloco escuro só sob
`:root[data-theme="dark"]`, sem `prefers-color-scheme`, a Lato pelo `next/font/google` nos pesos
400, 700 e 900 e no itálico 400, `lang="pt-BR"`, e nenhum dos SVGs do esqueleto em `public/`
nem a página inicial do `create-next-app`.

### CA3

**Marca:** revisão humana

**Cenário:** Dado o `compose.yaml`, quando quem revisa procura o serviço `e2e`, então encontra a
imagem `mcr.microsoft.com/playwright:v1.65.0-noble`, igual à versão exata do `@playwright/test`
no `package.json` do `web`, o `profiles: [e2e]`, o comando que o mantém parado,
`PLAYWRIGHT_HTML_OPEN=never` e `BASE_URL=http://web:3000` no ambiente. O alcance de
`http://web:3000` é provado pelo CA5.

### CA4

**Marca:** revisão humana

**Cenário:** Dado o `apps/web/playwright.config.ts`, quando quem revisa o abre, então encontra um
único projeto, Chromium, em modo headless, e o `@axe-core/playwright` no `package.json`. No
contêiner `e2e`, `npx playwright cli --help` responde sem instalação global.

### CA5

**Marca:** teste no Playwright

**Cenário:** Dado o ambiente de desenvolvimento de pé, com a web rodando, quando o comando de
testes de ponta a ponta roda no contêiner `e2e`, então o teste-semente abre `http://web:3000` e
passa.

**Teste previsto:** Playwright, `apps/web/e2e/seed.spec.ts`, "seed". Nesta tarefa o seed só abre
a web e confere que a página carregou com o título do produto; a T03 o leva a `/entrar` com uma
Pessoa pronta.

### CA6

**Marca:** documento

**Cenário:** Dado o `AGENTS.md` da raiz, quando quem revisa lê "Execução no Docker", então
encontra o serviço `e2e` na tabela e o comando para subi-lo pelo `profile`. Dado o
`apps/web/AGENTS.md`, quando lê "Comandos" e "Verificação completa", então encontra o comando dos
testes de ponta a ponta, rodado no contêiner `e2e`, e a indicação da skill `playwright-cli` como o
jeito de escrevê-los e corrigi-los.

### CA7

**Marca:** revisão humana

**Cenário:** Dado o branch da tarefa, quando quem revisa roda `pnpm lint` e
`pnpm exec tsc --noEmit` no contêiner `web`, então os dois terminam sem erro.

## Contrato

O contrato não muda.

## Verificação do contrato

Nenhum item.

## Decisões

- **Lugar da configuração:** `src/app/config/env.ts`, com `parseEnv` (o mesmo formato de erro da
  API: `Configuração inválida: <nomes>`) e `env`, o resultado já validado. Motivo: a estrutura de
  `apps/web/AGENTS.md` deixa tudo sob `src/app/`, e o módulo do Node faz a leitura acontecer uma
  vez só.
- **Falha na subida:** o `src/instrumentation.ts` importa `env` no `register()`, no runtime
  `nodejs`. Motivo: o `next dev` e o `next start` rodam o `register()` ao subir e terminam com
  código 1 quando ele lança, o que cumpre "falha na subida, e nunca no primeiro uso" (LLD,
  "Configuração"); conferido no contêiner antes do plano.
- **Tipos das variáveis:** `CHAT_API_URL` é URL obrigatória; `SESSION_COOKIE_NAME` é texto
  obrigatório; `SESSION_COOKIE_DOMAIN` é opcional, e vazio vale como ausente (LLD, "Valores e
  configuração": "vazio no local"); `SESSION_COOKIE_SECURE` é obrigatória e aceita só `true` ou
  `false`, para um valor digitado errado não desligar o `Secure` em produção sem aviso.
- **Valores locais:** vêm do `compose.yaml`, no serviço `web` (`CHAT_API_URL=http://chat-api:3000`,
  `SESSION_COOKIE_NAME=fc_session`, `SESSION_COOKIE_SECURE=false`, sem `SESSION_COOKIE_DOMAIN`), e
  o `apps/web/.env.example` lista as quatro com valores falsos. O `.gitignore` do web passa a
  aceitar o `.env.example`.
- **Só `src/app/config/` lê `process.env`:** regra `no-restricted-properties` no ESLint do web,
  igual à da API. O `instrumentation.ts` lê `process.env.NEXT_RUNTIME`, que é do próprio Next, e
  leva a exceção na linha. O `playwright.config.ts`, fora de `src/`, lê `BASE_URL`.
- **Tokens:** o `globals.css` reproduz o bloco de destino do design system como está, com o
  `@custom-variant dark` ligado a `data-theme`. Sem `prefers-color-scheme`: a F09 decide o tema.
- **Página inicial nesta tarefa:** `/` vira uma página mínima com o título "Full Cycle Chat",
  feita só com tokens, para o seed ter o que abrir. A T03 a troca pela Home.
- **Pasta dos testes:** `apps/web/e2e/`, com `seed.spec.ts` e, a partir da T03, `fixtures.ts`,
  os cenários e o plano de testes. Motivo: fica fora de `src/`, que é a aplicação.
- **Comando dos testes:** script `test:e2e` (`playwright test`) no `package.json` do web, rodado
  como `docker compose -f compose.yaml exec e2e npm run test:e2e`. A imagem do Playwright tem npm,
  e não pnpm; o script só chama o binário instalado no `node_modules`.
- **Usuário do contêiner `e2e`:** `1000:1000`, o mesmo do host e dos outros contêineres, para os
  relatórios e capturas saírem com o dono certo no disco montado.
- **Versão:** `@playwright/test` fixado em `1.65.0`, sem `^`, para a imagem e o pacote não se
  separarem num `pnpm install`.
- **Dev a partir de outro host:** o `next.config.ts` ganha `allowedDevOrigins: ['web']`, se o
  Next 16 recusar os recursos de desenvolvimento pedidos por `http://web:3000`.

## Arquivos e interfaces

- `apps/web/src/app/config/env.ts`: `parseEnv(raw)`, `env` e o tipo `Env`.
- `apps/web/src/instrumentation.ts`: `register()`, que carrega `env`.
- `apps/web/src/app/globals.css`: os tokens.
- `apps/web/src/app/layout.tsx`: Lato, `lang="pt-BR"`, metadata do produto.
- `apps/web/src/app/page.tsx`: página mínima.
- `apps/web/public/*.svg`: removidos.
- `apps/web/eslint.config.mjs`: regra de `process.env`.
- `apps/web/playwright.config.ts`, `apps/web/e2e/seed.spec.ts`.
- `apps/web/package.json`: `zod`, `@playwright/test`, `@axe-core/playwright`, script `test:e2e`.
- `apps/web/.env.example`, `apps/web/.gitignore`.
- `compose.yaml`: ambiente do `web` e serviço `e2e`.
- `AGENTS.md`, `apps/web/AGENTS.md`.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

- `docs/lld.md`, seção "Onde mora cada fato": o schema das variáveis da `web` passa a apontar
  para `apps/web/src/app/config/env.ts` (planejado).
