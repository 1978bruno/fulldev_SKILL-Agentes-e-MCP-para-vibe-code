# Plano da F02-T01: Bases de transação e de testes de unidade

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste de integração

**Cenário:** Dado o módulo raiz e o módulo do comando de contas, quando sobem, então o
`@nestjs-cls/transactional` está registrado com o adaptador do TypeORM e o `TransactionHost`
pode ser injetado. A compatibilidade com o TypeORM 1.x vem do `peerDependencies` do adaptador
(`typeorm ^0.3.2 || ^1.0.0`) e é provada pelos testes de CA3 e CA4 rodando com o TypeORM do
projeto.

**Teste previsto:** integração, `src/database/transactional.int-spec.ts`, "desfaz as gravações
de dois módulos quando a operação falha" (o mesmo de CA3), e a suíte e2e da F01, que sobe o
`AppModule` inteiro.

### CA2

**Marca:** teste HTTP

**Cenário:** Dado o `PeopleService` acessando o banco pelo `TransactionHost`, quando a suíte da
F01 roda (entrar, limite de tentativas, sair, verificar), então todos os casos continuam passando.

**Teste previsto:** e2e da API, as suítes `test/sessions.e2e-spec.ts` e
`test/login-attempts.e2e-spec.ts`, sem mudança.

### CA3

**Marca:** teste de integração

**Cenário:** Dado um service de orquestração com `@Transactional()` que cria uma Pessoa pelo
`PeopleService` e grava uma segunda linha por um service de outro módulo, quando a segunda
gravação lança erro, então nem a Pessoa nem a segunda linha ficam no banco. E, sem o erro, as duas
ficam.

**Teste previsto:** integração, `src/database/transactional.int-spec.ts`, "desfaz as gravações de
dois módulos quando a operação falha" e "grava as duas quando a operação termina".

### CA4

**Marca:** teste de integração

**Cenário:** Dado o comando de contas rodando dentro de um contexto do CLS, quando cria uma conta,
redefine a senha e revoga Sessões, então o comportamento é o da F01.

**Teste previsto:** integração, `src/accounts/accounts.command.int-spec.ts`, sem mudança nos
casos.

### CA5

**Marca:** teste de unidade

**Cenário:** Dado o Vitest no projeto `web`, quando roda, então prova uma função pura que já
existe, a `safeReturnPath`, com os casos da regra do LLD ("Cliente", "Voltar para onde ia").

**Teste previsto:** unidade (Vitest), `src/app/utils/return-path.test.ts`, "aceita caminho
relativo", "recusa // e /\\", "recusa o que a normalização leva para fora".

### CA6

**Marca:** documento

**Cenário:** Dado o `apps/chat-api/AGENTS.md`, quem lê encontra como um service participa de uma
transação: `@Transactional()` em quem orquestra, `TransactionHost` em quem participa e
`ClsService.run` no código que roda fora do HTTP.

### CA7

**Marca:** revisão humana

**Cenário:** Dado o fim da tarefa, quem revisa encontra no PR a verificação completa da API e a da
web passando no contêiner.

## Contrato

O contrato não muda.

## Verificação do contrato

Nenhuma: a tarefa não cria nem muda rota, evento ou tabela.

## Decisões

- O registro do CLS fica no `DatabaseModule`, que o módulo raiz e o do comando de contas já
  importam: a transação é parte do acesso ao banco, e um módulo novo só repetiria o import.
- No HTTP, o contexto do CLS é aberto pelo middleware do `ClsModule` (`mount: true`). Fora do
  HTTP, o código que chama os services envolve a execução com `ClsService.run`: o `cli.ts` do
  comando de contas e os testes de integração.
- As transações explícitas do `PeopleService` (`withPasswordUnchanged` e `changePassword`) passam
  a `TransactionHost.withTransaction`, e o `EntityManager` repassado às callbacks continua o
  mesmo, para o `SessionsService` não mudar nesta tarefa.
- O segundo service do teste de CA3 é um service de teste, num módulo próprio do arquivo de
  teste, que grava pelo `TransactionHost`. O módulo de Conversas, o primeiro de produção a
  precisar disso, chega na F02-T02.
- O Vitest entra com a versão 4.1.12, em ambiente Node, só para arquivos `*.test.ts` em `src/`,
  com o alias `@/` igual ao do `tsconfig`. O Playwright continua lendo só `e2e/`, então as duas
  suítes não se cruzam.

## Arquivos e interfaces

- `apps/chat-api/package.json`: `nestjs-cls`, `@nestjs-cls/transactional` e
  `@nestjs-cls/transactional-adapter-typeorm`.
- `apps/chat-api/src/database/database.module.ts`: `ClsModule.forRoot` global, com o middleware e
  o `ClsPluginTransactional` com o `TransactionalAdapterTypeOrm`.
- `apps/chat-api/src/people/people.service.ts`: o repositório sai do `@InjectRepository` e vem de
  `TransactionHost<TransactionalAdapterTypeOrm>`.
- `apps/chat-api/src/people/people.module.ts`: sem o `TypeOrmModule.forFeature`, se nada mais o
  usar.
- `apps/chat-api/src/accounts/cli.ts`: a execução do comando dentro de `ClsService.run`.
- `apps/chat-api/src/database/transactional.int-spec.ts`: o teste de CA3.
- `apps/chat-api/AGENTS.md`: a seção "A camada de serviços" ganha a regra de transação.
- `apps/web/package.json`: `vitest` e o script `test`.
- `apps/web/vitest.config.ts`: ambiente Node, `src/**/*.test.ts` e o alias `@/`.
- `apps/web/src/app/utils/return-path.test.ts`: o teste de CA5.
- `apps/web/AGENTS.md`: `pnpm test` em "Comandos" e na "Verificação completa".

## Testes existentes que mudam

Nenhum. O teste de integração do comando de contas pode precisar abrir o contexto do CLS antes de
chamar o comando, como o `cli.ts`; os casos não mudam.

## Mudança de dados

Nenhuma.

## Documentos atualizados

- `docs/roadmap.md`: a F02 passa a "em andamento", no primeiro commit de plano dela.
