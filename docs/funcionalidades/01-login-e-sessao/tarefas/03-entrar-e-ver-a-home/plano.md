# Plano da F01-T03: Entrar com uma conta criada por comando e ver a Home

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** revisão humana

**Cenário:** Dado o diff da tarefa, quando quem revisa abre `apps/chat-api/migrations/`, então
encontra a migração gerada pelo TypeORM com `people` e `sessions` nas colunas e restrições do
contrato abaixo. O e-mail gravado já normalizado é provado pelo CA3 (o login aceita a forma com
maiúsculas e espaços porque o service normaliza antes de gravar e de comparar) e pelo CA2.

### CA2

**Marca:** teste de integração

**Cenário 1:** Dado o comando de contas com a leitura da senha substituída por uma senha dada,
quando roda `create` com um e-mail com maiúsculas e espaços nas pontas e um nome, então a Pessoa
existe com o e-mail normalizado, o `password_hash` começa com `$argon2id$` e a senha dada é
verificada contra ele.

**Cenário 2:** Dado uma Pessoa já criada, quando `create` roda de novo com o mesmo e-mail, então o
comando termina com falha, a mensagem diz que o e-mail já existe e nenhuma Pessoa nova é gravada.

**Teste previsto:** integração, `apps/chat-api/src/accounts/accounts.command.int-spec.ts`, "cria a
Pessoa com o e-mail normalizado e a senha em Argon2id" e "recusa um e-mail que já existe". A
leitura sem eco em si (`TtyPasswordPrompt`) é conferida por quem revisa, rodando
`docker compose -f compose.yaml exec chat-api pnpm accounts create <e-mail> "<nome>"`.

### CA3

**Marca:** teste HTTP

**Cenário:** Dado uma Pessoa criada com `Ana@Empresa.com`, quando ela entra com
`"  ANA@empresa.com "` e a senha certa, então recebe 201 com `token` e `person` (`id`, `name`,
`email`), e a linha em `sessions` tem `token_hash` igual ao SHA-256 do token, e não o token.

**Teste previsto:** e2e da API, `test/sessions.e2e-spec.ts`, "responde 201 com o token e a Pessoa e
grava só o hash do token" e "aceita o e-mail com maiúsculas e espaços nas pontas".

### CA4

**Marca:** teste HTTP

**Cenário:** Dado uma Pessoa criada, quando alguém entra com um e-mail sem conta e, em outra
requisição, com a senha errada, então as duas respostas são 401 `invalid_credentials` com
corpos idênticos. A verificação contra o hash fictício é conferida por quem revisa no
`SessionsService`.

**Teste previsto:** e2e da API, `test/sessions.e2e-spec.ts`, "responde 401 invalid_credentials com
o mesmo corpo para e-mail sem conta e senha errada".

### CA5

**Marca:** teste HTTP

**Cenário:** Dado a API de pé, quando alguém envia e-mail fora do formato, senha vazia, e-mail com
255 caracteres ou senha com 257, então cada caso recebe 400 `validation_failed`.

**Teste previsto:** e2e da API, `test/sessions.e2e-spec.ts`, "responde 400 validation_failed para
entrada inválida", com `it.each` sobre os quatro casos.

### CA6

**Marca:** teste HTTP

**Cenário:** Dado uma Pessoa que entrou, quando `GET /v1/sessions/current` recebe o cookie com o
token, então responde 200 com a `person`. Sem cookie, ou com um token desconhecido, responde 401
`unauthenticated`. O guard reaproveitável (`AuthGuard`, que lê o cookie e põe a Pessoa na
requisição) é conferido por quem revisa.

**Teste previsto:** e2e da API, `test/sessions.e2e-spec.ts`, "responde 200 com a Pessoa da
Sessão", "responde 401 unauthenticated sem cookie" e "responde 401 unauthenticated com token
desconhecido".

### CA7

**Marca:** revisão humana

**Cenário:** Dado o diff da tarefa, quando quem revisa abre `apps/web/src/app/actions/login.ts` e
`apps/web/src/app/services/`, então encontra o Server Action chamando o service HTTP, o cookie
gravado com `httpOnly`, `secure` vindo de `SESSION_COOKIE_SECURE`, `sameSite: 'lax'`, `path: '/'`,
`maxAge` de 400 dias e `domain` de `SESSION_COOKIE_DOMAIN`, e nenhum `fetch` fora de
`src/app/services/`. O comportamento do cookie (outra navegação já logada) é provado pelo CA13.

### CA8

**Marca:** teste no Playwright

**Cenário 1:** Dado um navegador sem cookie, quando abre `/`, então vai para `/entrar`.

**Cenário 2:** Dado um navegador com um cookie de sessão cujo token a API não conhece, quando abre
`/`, então vai para `/entrar` e o cookie deixa de existir.

**Teste previsto:** Playwright, `apps/web/e2e/login/redireciona-sem-sessao.spec.ts` e
`apps/web/e2e/login/sessao-desconhecida-volta-para-entrar.spec.ts`.

### CA9

**Marca:** teste no Playwright

**Cenário:** Dado a tela Entrar, quando abre, então o foco está no E-mail; quando envia com a senha
errada, então o botão fica em `loading` durante o envio, a mensagem "E-mail ou senha incorretos.
Confira os dados e tente de novo." aparece abaixo da Senha, a Senha fica vazia e com foco, e o
E-mail continua preenchido. O bloqueio do envio duplo é conferido por quem revisa (botão
`disabled` com `loading` e o `pending` do `useActionState`); a reprodução dos frames, pela
validação visual do CA14.

**Teste previsto:** Playwright, `apps/web/e2e/login/credenciais-incorretas.spec.ts`.

### CA10

**Marca:** teste no Playwright

**Cenário:** Dado uma Pessoa que entra, quando chega à Home, então vê o Rail com "FC", "Início"
ativo e o avatar com as iniciais dela, a Sidebar com o cabeçalho "Full Cycle" e o Main no estado
"Home / Vazio". A ausência dos itens futuros e a fidelidade ao Figma são conferidas pela validação
visual do CA14.

**Teste previsto:** Playwright, `apps/web/e2e/login/entrar-ate-a-home.spec.ts`.

### CA11

**Marca:** revisão humana

**Cenário:** Dado o arquivo do Figma, página Telas, seção Login, quando quem revisa procura o nó
19:1399, então ele se chama "Login / Credenciais incorretas".

### CA12

**Marca:** revisão humana

**Cenário:** Dado o diff, quando quem revisa abre `test/sessions.e2e-spec.ts` e
`test/support/auth-routes.ts`, então os testes de CA3 a CA6 preparam a Pessoa e a Sessão pelos
atalhos de `authRoutes` (`createPerson`, `login`), e o teste de integração do comando prova o CA2.

### CA13

**Marca:** teste no Playwright

**Cenário:** Dado a fixture `person`, quando o teste entra pelo formulário, então chega à Home; e
outra página do mesmo contexto, aberta em `/`, já está logada (prova o cookie).

**Teste previsto:** Playwright, `apps/web/e2e/login/entrar-ate-a-home.spec.ts` e o teste-semente
`apps/web/e2e/seed.spec.ts`, que passa a abrir `/entrar` com uma Pessoa pronta. As fixtures ficam
em `apps/web/e2e/fixtures.ts`, e o plano de testes em
`apps/web/e2e/plano-de-testes-f01.md`, escrito pelo fluxo da skill `playwright-cli`.

### CA14

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quando quem revisa abre `validacao-visual.md`, então
encontra as capturas de Entrar ("Padrão", "Enviando", "Credenciais incorretas") e da Home, em
1440 × 900 nos temas claro e escuro, ao lado das capturas dos frames do Figma, com as diferenças
encontradas e o que foi feito com cada uma.

### CA15

**Marca:** documento

**Cenário:** Dado o `apps/chat-api/AGENTS.md`, quando quem revisa lê "Comandos", então encontra o
comando de contas com a operação `create` e a nota de que a senha é lida do terminal.

## Contrato

### people · chat · nova

| Coluna | Tipo | Nulo | Padrão | Observação |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | não | — | UUID v7 gerado na aplicação |
| `email` | `text` | não | — | Normalizado (sem espaços nas pontas, minúsculas) |
| `name` | `text` | não | — | |
| `password_hash` | `text` | não | — | Argon2id |
| `created_at` | `timestamptz` | não | `now()` | |
| `updated_at` | `timestamptz` | não | `now()` | |

- Chave primária: `id`. Única: `email`.

### sessions · chat · nova

| Coluna | Tipo | Nulo | Padrão | Observação |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | não | — | UUID v7 |
| `person_id` | `uuid` | não | — | |
| `token_hash` | `text` | não | — | SHA-256 do token, em hexadecimal |
| `expires_at` | `timestamptz` | não | — | |
| `last_used_at` | `timestamptz` | não | — | |
| `created_at` | `timestamptz` | não | `now()` | |
| `updated_at` | `timestamptz` | não | `now()` | |

- Chave primária: `id`. Única: `token_hash`. Estrangeira: `person_id` → `people.id`,
  `ON DELETE CASCADE`. Índice: `person_id` (revogar todas as Sessões de uma Pessoa, T06).

### POST /v1/sessions · nova

| Item | Valor |
| --- | --- |
| Autenticação | Pública |
| Corpo da requisição | `email` (texto, obrigatório, formato de e-mail depois de tirar os espaços das pontas, até 254), `password` (texto, obrigatório, não vazio, até 256) |
| Resposta de sucesso | 201 `{ "token": string, "person": { "id": string, "name": string, "email": string } }` |
| Cabeçalhos de resposta | Nenhum |
| Erros | 400 `validation_failed`; 401 `invalid_credentials` |

### GET /v1/sessions/current · nova

| Item | Valor |
| --- | --- |
| Autenticação | Cookie de Sessão (nome em `SESSION_COOKIE_NAME`), lido pelo `AuthGuard` |
| Resposta de sucesso | 200 `{ "person": { "id": string, "name": string, "email": string } }` |
| Erros | 401 `unauthenticated` |

### GET /api/session/expired · BFF · nova

| Item | Valor |
| --- | --- |
| Autenticação | Cookie de Sessão, se houver |
| Chama | `GET /v1/sessions/current`, repassando o cookie |
| Resposta | 307 para `/entrar`, apagando o cookie, quando a API responde 401 ou não há cookie; 307 para `/` quando a API responde 200 (o cookie fica) |
| Acrescenta ou tira | Tira o cookie (`Set-Cookie` com `Max-Age=0`) no 401 |

## Verificação do contrato

- `people`, única em `email`: CA2, cenário 2 (o comando recusa o duplicado pela checagem do
  service; a única garante o caso concorrente e não tem teste próprio).
- `sessions`, única em `token_hash` e estrangeira com cascata: sem teste nesta tarefa; a cascata
  passa a ser exercida quando uma Pessoa for apagada (fora da F01), e a unicidade é garantida pelos
  32 bytes aleatórios. Conferidas na migração pelo CA1.
- `POST /v1/sessions` 201: CA3. 400: CA5. 401: CA4.
- `GET /v1/sessions/current` 200 e 401: CA6.
- `GET /api/session/expired`: CA8, cenário 2 (401 apaga o cookie e leva a `/entrar`). O caminho
  200 acontece só quando a Sessão volta a valer entre a renderização e o redirecionamento e não
  tem teste.

## Decisões

- **Módulos da API:** `people` (entidade, `PeopleService` com `create`, `findByEmail`,
  `findById`, e `PasswordHasher`), `sessions` (entidade, `SessionsService` com `login` e
  `authenticate`, `SessionsController`, `AuthGuard`) e `accounts` (o comando). Motivo: cada
  módulo é dono das tabelas dele (`apps/chat-api/AGENTS.md`, "A camada de serviços").
- **Argon2id:** `@node-rs/argon2`, com os parâmetros padrão da biblioteca (Argon2id, m=19456,
  t=2, p=1, o mínimo da OWASP). Motivo: binários prontos, sem compilação nativa nem
  `allowBuilds` no pnpm.
- **Hash fictício:** um hash Argon2id de uma senha aleatória, gerado uma vez na subida do
  `PasswordHasher`, verificado quando o e-mail não tem conta (LLD, "Segurança").
- **Token:** 32 bytes de `crypto.randomBytes` em base64url; `token_hash` é o SHA-256 em
  hexadecimal.
- **Nome do cookie na API:** a API lê o cookie pelo nome em `SESSION_COOKIE_NAME`, a mesma
  variável da web, porque o BFF repassa o cookie do navegador como veio (LLD, "Interfaces"). Ela
  entra no schema da API e no LLD, "Variáveis de ambiente". O parse do cabeçalho é do pacote
  `cookie`.
- **Duração da Sessão:** a variável `SESSION_TTL_DAYS`, com padrão 30, entra já nesta tarefa,
  porque o login grava `expires_at`. A T06 prova a renovação e o vencimento.
- **Validação do e-mail:** o DTO tira os espaços das pontas antes de validar o formato e o tamanho
  (`@Transform`), e o `SessionsService` normaliza (pontas e minúsculas) antes de procurar. O
  `PeopleService.create` normaliza antes de gravar.
- **Erros novos:** `invalid_credentials` (401) e `unauthenticated` (401), em
  `InvalidCredentialsError` e `UnauthenticatedError`, no `ErrorCode` e no mapa do filter.
- **Comando de contas:** `src/accounts/cli.ts`, rodado por `pnpm accounts <operação> ...`, sobe o
  `AccountsModule` com `NestFactory.createApplicationContext` e chama o `AccountsCommand`, uma
  classe comum (não é provider) que recebe o `PeopleService`, o `PasswordPrompt` e a saída. O
  `TtyPasswordPrompt` lê a senha com o terminal em modo raw, sem eco; sem terminal, lê uma linha
  da entrada padrão. O teste de integração monta o `AccountsModule` real e passa um
  `PasswordPrompt` que devolve a senha dada, sem `overrideProvider`.
- **BFF, service HTTP:** `src/app/services/chat-api.ts`, com `login` e `getCurrentPerson`, que
  devolvem uniões de resultado (`ok`, `invalid_credentials`, `unauthenticated`, `failure`) em vez
  de lançar, e um tempo limite de 5 s por chamada.
- **Proxy:** `src/proxy.ts`, que roda em toda rota menos `/entrar`, `/api`, `/_next` e arquivos
  estáticos, e manda para `/entrar` sem o cookie.
- **Layout logado:** o grupo `src/app/(app)/`, com o layout que, dentro de um `<Suspense>`
  (exigido pelo `cacheComponents`), verifica a Sessão a cada renderização. Com 401, redireciona a
  `/api/session/expired`, porque um Server Component não pode apagar cookie (só Server Functions
  e Route Handlers); a rota confere de novo na API antes de apagar, para um link de outro site não
  derrubar um cookie válido. Nesta tarefa, a falha de rede ou 5xx também leva a `/entrar` pelo
  mesmo caminho; a T09 troca isso pela tela de erro.
- **Tela Entrar:** `src/app/entrar/page.tsx` (Server Component) com o formulário em
  `src/app/components/auth/login-form.tsx` (`"use client"`, `useActionState`). Os primitivos
  `Button`, `Input`, `Field`, `Spinner` e `Avatar` entram em `src/app/components/ui/`, com CVA,
  `clsx`, `tailwind-merge` e `lucide-react` instalados agora. A validação no cliente e as
  mensagens de campo ficam para a T04; nesta tarefa o formulário já usa `noValidate` e o Server
  Action só aceita o envio com e-mail e senha preenchidos.
- **Shell da Home:** `src/app/components/workspace-nav/rail.tsx` e `sidebar.tsx`, e o
  `EmptyState` em `ui/`, compostos no layout logado; o Main com "Home / Vazio" é a página
  `src/app/(app)/page.tsx`.
- **Pessoa da Sessão nos componentes:** o layout logado passa a Pessoa por props ao Rail; não há
  contexto de cliente nesta tarefa.
- **Fixtures do Playwright:** `person` grava a Pessoa no banco `chat` pelo `pg`, com e-mail
  `e2e-<uuid>@teste.local` e o hash Argon2id fixo de `senha-de-teste-123`, guardado em
  `e2e/support/test-person.ts`; o contêiner `e2e` recebe `DATABASE_URL` do banco `chat`.
  `loggedInPage` entra pelo formulário. As Pessoas de teste ficam no banco (LLD, "Ambiente de
  desenvolvimento").

## Arquivos e interfaces

- API: `src/people/{person.entity,people.service,password-hasher,people.module}.ts`;
  `src/sessions/{session.entity,sessions.service,sessions.controller,auth.guard,current-person.decorator,login.dto,sessions.module}.ts`
  e os erros `invalid-credentials.error.ts`, `unauthenticated.error.ts`;
  `src/accounts/{accounts.module,accounts.command,password-prompt,cli}.ts`;
  `src/common/errors/error-code.ts`, `problem-details.filter.ts`; `src/config/env.schema.ts`;
  `src/app.module.ts`; `migrations/<timestamp>-CreatePeopleAndSessions.ts`;
  `test/sessions.e2e-spec.ts`, `test/support/auth-routes.ts`; `package.json` (script
  `accounts`, `@node-rs/argon2`, `cookie`); `.env.example`; `AGENTS.md`.
- Web: `src/proxy.ts`; `src/app/services/chat-api.ts`; `src/app/services/session-cookie.ts`;
  `src/app/actions/login.ts`; `src/app/api/session/expired/route.ts`; `src/app/entrar/page.tsx`;
  `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx` (substitui `src/app/page.tsx`);
  `src/app/components/ui/*`, `src/app/components/auth/login-form.tsx`,
  `src/app/components/workspace-nav/*`; `src/app/utils/cn.ts`, `src/app/utils/initials.ts`;
  `e2e/fixtures.ts`, `e2e/support/*`, `e2e/seed.spec.ts`, `e2e/login/*.spec.ts`,
  `e2e/plano-de-testes-f01.md`; `package.json`.
- `compose.yaml`: `SESSION_COOKIE_NAME` e `SESSION_TTL_DAYS` no `chat-api`; `DATABASE_URL` no
  `e2e`.

## Testes existentes que mudam

- `apps/web/e2e/seed.spec.ts`: passa a abrir `/entrar` com uma Pessoa pronta (spec, "Base dos
  testes da web").

## Mudança de dados

Nenhuma. As Pessoas de desenvolvimento são criadas pelo comando de contas.

## Documentos atualizados

- `docs/lld.md`, "Valores e configuração" ("Variáveis de ambiente"): `SESSION_COOKIE_NAME` passa a
  valer também na API do chat.
- `docs/lld.md`, "Interfaces" ("Índice das rotas"): a rota do BFF `GET /api/session/expired`,
  planejada.
- `docs/lld.md`, "Cliente" ("Sessão no cliente"): o 401 do layout logado passa pela rota
  `/api/session/expired`, que apaga o cookie.
