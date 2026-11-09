# Plano da F04-T02: Canal privado visível só para quem o criou

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** documento

**Cenário:** Quem revisa abre o frame "Conversa / Estrutura / Canal privado" (21:3570) do Figma e
encontra, no ConversationHeader, o cadeado e o nome `diretoria`, o Canal destacado na barra
lateral, no lugar de `geral`.

### CA2

**Marca:** teste HTTP

**Cenário:** Dado o banco de testes migrado, quando um Canal privado é criado, então a linha tem
`kind` `private_channel` e nome. Uma linha `private_channel` sem nome é recusada pelo banco.

**Teste previsto:** e2e da API, `test/conversations-create.e2e-spec.ts`, "cria o Canal privado só
com quem o criou" (confere a linha) e "o banco recusa Canal privado sem nome" (inserção direta,
que espera o erro do `CHECK`).

### CA3

**Marca:** teste HTTP

**Cenário:**
- Dada uma Pessoa com Sessão, quando ela cria um Canal com `kind` `private_channel`, então recebe
  201 com `member_count` 1, e só ela é Membro.
- O reenvio com o mesmo `client_id` devolve o mesmo Canal privado.
- O nome de um Canal privado já existente, de que a Pessoa não é Membro, recebe
  `channel_name_taken` (409), e o nome de um Canal público já existente também, ao criar um
  privado.

**Teste previsto:** e2e da API, `test/conversations-create.e2e-spec.ts`, "cria o Canal privado só
com quem o criou", "o reenvio do Canal privado devolve o mesmo Canal", "o nome de um Canal privado
de que a Pessoa não é Membro responde 409" e "o Canal privado com o nome de um público responde 409".

### CA4

**Marca:** teste no Playwright

**Cenário:** Dado o diálogo "Criar canal", quando a Pessoa liga "Tornar privado" (pelo teclado) e
cria o Canal, então a Conversa abre com ela como única Membro.

**Teste previsto:** Playwright, `e2e/canais-privados/criar-canal-privado.spec.ts`, "cria o Canal
privado pelo Switch e cai nele".

### CA5

**Marca:** teste no Playwright

**Cenário:** Dado um Canal privado e um público de que a Pessoa é Membro, então a barra lateral
mostra os dois juntos, em ordem alfabética, o privado com o ícone de cadeado e o público com o `#`,
e o cabeçalho e o começo do Canal privado mostram o cadeado.

**Teste previsto:** Playwright, `e2e/canais-privados/criar-canal-privado.spec.ts` (o de CA4, que
confere o cadeado no cabeçalho, na barra lateral e no começo do Canal) e
`e2e/canais-privados/privado-junto-dos-publicos.spec.ts`, "o Canal privado fica em ordem alfabética
junto dos públicos, com o cadeado".

### CA6

**Marca:** teste HTTP

**Cenário:**
- Dado um Canal privado criado por outra Pessoa, quando quem não é Membro pede a Conversa, o
  histórico ou o envio de Mensagem, então recebe 404 `conversation_not_found`, e a lista de
  Conversas dela não traz o Canal.
- Dada uma conta criada depois do Canal privado, então ela não é Membro dele.

**Teste previsto:** e2e da API, `test/conversations-create.e2e-spec.ts`, "quem não é Membro não vê
o Canal privado em lista nem rota"; integração, `src/accounts/accounts.command.int-spec.ts`, "a
conta nova não entra nos Canais privados".

### CA7

**Marca:** teste no Playwright

**Cenário:** Dado um Canal privado criado por uma Pessoa, quando outra Pessoa entra, então não o vê
na barra lateral e, pelo endereço dele, vê "Conversa não encontrada".

**Teste previsto:** Playwright, `e2e/canais-privados/quem-nao-e-membro-nao-ve.spec.ts`, "quem não é
Membro não vê o Canal privado na barra lateral nem pelo endereço".

### CA8

**Marca:** documento

**Cenário:** Quem revisa encontra nesta pasta `validacao-visual.md`, com as capturas em 1440 × 900,
nos dois temas, do diálogo com "Tornar privado" ligado e desligado, e da Conversa de um Canal
privado (barra lateral e cabeçalho), ao lado dos frames "Diálogos / Criar canal / Padrão" e
"Conversa / Estrutura / Canal privado".

## Contrato

### POST /v1/conversations · alterada

| Item | Antes | Depois |
| --- | --- | --- |
| Corpo da requisição | `kind` só `public_channel` | `kind` `public_channel` ou `private_channel` |
| Resposta de sucesso | Canal público com todas as Pessoas | Também o Canal privado, com `member_count` 1 |

### Server Action `createChannel` · alterada

| Item | Antes | Depois |
| --- | --- | --- |
| Entrada | `name`, `topic`, `clientId` | Também `isPrivate` (booleano) |
| Rota da API | `kind` `public_channel` | `kind` `private_channel` quando `isPrivate` |

### conversations · chat · alterada

- `conversations_kind_check`: `"kind" IN ('public_channel', 'private_channel')`.
- `conversations_channel_name_check`: `"kind" NOT IN ('public_channel', 'private_channel') OR
  "name" IS NOT NULL`.
- Os dois `CHECK` são trocados na migração (o TypeORM gera a troca a partir do `@Check` da
  entidade).

## Verificação do contrato

- `POST /v1/conversations` com `private_channel`, 201 e reenvio: CA3.
- `POST /v1/conversations` 409 com nome de Canal privado ou público: CA3.
- `conversations_kind_check` e `conversations_channel_name_check`: CA2.
- Server Action `createChannel` com `isPrivate`: CA4.

## Decisões

- `insertChannel` grava a participação conforme o tipo: todas as Pessoas no público, só quem
  criou no privado. Sem criador, o privado é recusado, e o comando continua só com o público.
- O `ChannelKind` da API e o da web ganham `private_channel`; a `ConversationKind` da web também.
- Um componente `ChannelIcon` (o mesmo nome do Figma, seção Entities) escolhe `Lock` ou `Hash` pelo
  tipo e é usado na SidebarRow, no ConversationHeader e no ConversationIntro, para o ícone do Canal
  privado ser um só lugar.
- O Switch do design system (`ui/switch.tsx`, Radix Switch) entra nesta tarefa, com o texto "Só
  pessoas convidadas veem e participam de um canal privado." do frame. A palavra "convidadas" é do
  Figma e fica até o redesenho da T04, que muda o passo de adicionar.
- O Canal privado abre direto depois de criado; o passo "Adicionar pessoas" é da T04.
- Os testes do Playwright que criam Canal privado pela tela não mexem nas outras Pessoas (o
  privado só tem quem o criou) e ficam no projeto principal, numa pasta `e2e/canais-privados/`.
  Cada teste apaga no fim os Canais que criou.

## Arquivos e interfaces

- `apps/chat-api/src/conversations/conversation.entity.ts`: `ConversationKind` e os dois `@Check`.
- `apps/chat-api/migrations/<timestamp>-AddPrivateChannel.ts`: a troca dos `CHECK`.
- `apps/chat-api/src/conversations/conversations.service.ts`: `ChannelKind` e a participação por
  tipo em `insertChannel`.
- `apps/chat-api/src/conversations/create-conversation.dto.ts`: os dois tipos.
- `apps/web/src/app/services/chat-api.ts`: `ConversationKind` e o `kind` de `createChannel`.
- `apps/web/src/app/actions/create-channel.ts`: `isPrivate`.
- `apps/web/src/app/components/ui/switch.tsx`: o Switch.
- `apps/web/src/app/components/conversation/channel-icon.tsx`: `ChannelIcon`.
- `apps/web/src/app/components/workspace-nav/create-channel-dialog.tsx`: "Tornar privado".
- `apps/web/src/app/components/workspace-nav/sidebar-row.tsx`, `sidebar.tsx`,
  `apps/web/src/app/components/conversation/conversation-header.tsx`, `conversation-intro.tsx`,
  `message-history.tsx` e a página da Conversa: o tipo do Canal até o ícone.

## Testes existentes que mudam

- `apps/chat-api/test/conversations-create.e2e-spec.ts`: o caso "kind de Canal privado responde
  400" sai, porque o tipo passa a ser aceito.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum. O LLD e a spec já registram o Canal privado; a tarefa só o implementa.
