# Plano da F02-T09: Comando de canais completo e conta nova nos Canais

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste de integração

**Cenário:**
- `set-topic`:
  - Dado um Canal, quando quem opera roda `pnpm channels set-topic <nome> "<tópico>"`, então o
    Tópico muda, pela mesma regra do `create`.
  - Com o Tópico vazio (`""`), o Tópico é apagado.
  - Com um nome que não existe, o comando sai com código 1 e a mensagem
    `Canal não encontrado: <nome>.`.
  - Com um Tópico inválido (quebra de linha), o comando sai com código 1, sem gravar.
- `list` lista os Canais públicos em ordem alfabética, uma linha por Canal, com o nome, o número
  de Membros e o Tópico.

**Teste previsto:** integração, `src/channels/channels.command.int-spec.ts`.

### CA2

**Marca:** teste de integração

**Cenário:** Dado Canais públicos existentes, quando quem opera cria uma conta pelo comando de
contas, então a Pessoa e a participação dela em todos os Canais públicos são gravadas numa
transação só, que começa tomando a trava de participação (`lockPublicMembership`).

**Teste previsto:** integração, `src/accounts/accounts.command.int-spec.ts`.

### CA3

**Marca:** teste de integração

**Cenário:**
- A conta nova é Membro de todos os Canais públicos que existiam antes dela.
- Uma falha ao gravar a participação (o método que grava a participação, trocado no teste por um
  que lança erro) desfaz a criação da Pessoa: o e-mail não existe depois.
- Com a trava tomada por outra transação, a criação da conta espera a trava ser solta.

**Teste previsto:** integração, `src/accounts/accounts.command.int-spec.ts`.

### CA4

**Marca:** revisão humana

**Cenário:** Dado o `apps/chat-api/AGENTS.md`, seção "Comandos", quem revisa encontra
`pnpm channels set-topic` e `pnpm channels list`, e o `create` de contas dizendo que a conta entra
nos Canais públicos.

## Contrato

O contrato HTTP não muda. Mudam os comandos de terminal, como em CA1.

## Verificação do contrato

Nenhuma: a tarefa não cria nem muda rota, evento ou tabela.

## Decisões

- **Conta nova nos Canais.** `ConversationsService.createPersonInPublicChannels(newPerson)` é
  `@Transactional()`. Ela:
  1. toma a trava de participação;
  2. chama `PeopleService.create`;
  3. grava a participação da Pessoa em todos os Canais públicos com `INSERT … SELECT` e
     `ON CONFLICT DO NOTHING`, para tolerar a participação que já existe (spec, "Toda Pessoa em
     todo Canal público").

  O `AccountsModule` importa o `ConversationsModule`, e o `create` do comando de contas chama esse
  método no lugar do `PeopleService.create`.
- **`set-topic`.** `ConversationsService.setPublicChannelTopic(name, rawTopic)` normaliza o nome
  como o `create`, valida o Tópico com `parseTopic` e lança `ChannelNotFoundError`, um
  `DomainError`, quando nenhum Canal público tem o nome.
- **`list`.** `ConversationsService.listPublicChannels()` devolve o nome, o Tópico e o número de
  Membros, numa consulta com `count` agrupado. A saída fica numa linha por Canal:
  `#nome (N Membros) Tópico`.

## Arquivos e interfaces

- `src/conversations/conversations.service.ts`: os três métodos.
- `src/conversations/channel-not-found.error.ts`.
- `src/channels/channels.command.ts`: as operações `set-topic` e `list`.
- `src/accounts/accounts.command.ts`, `cli.ts` e `accounts.module.ts`: o `create` pela
  orquestração nova.
- Os testes de integração dos dois comandos.
- `apps/chat-api/AGENTS.md`, "Comandos".

## Testes existentes que mudam

- `src/accounts/accounts.command.int-spec.ts`: o comando recebe o `ConversationsService`.

## Mudança de dados

Nenhuma.

## Documentos atualizados

- `apps/chat-api/AGENTS.md`, "Comandos".
- `docs/lld.md`: a situação da participação na criação da conta, se estiver marcada como
  `planejada`.
