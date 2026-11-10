# Plano da F04-T05: Lista de Membros e adicionar depois

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** documento

**Cenário:** Quem revisa abre o Figma e encontra:
- o frame "Conversa / Sobreposições / Membros do canal privado", com o cadeado no cabeçalho e o botão
  "Adicionar pessoas" no rodapé da lista;
- o passo "Adicionar pessoas" aberto pela lista de Membros, que reaproveita os frames "Diálogos /
  Adicionar pessoas" da T04, com o rodapé "Voltar" e "Adicionar". A nota no frame novo diz isso.

### CA2

**Marca:** teste HTTP

**Cenário:**
- Dado um Canal privado com três Membros, quando um deles pede os Membros, então recebe 200 com
  `members` (`id`, `name`) em ordem alfabética do pt-BR.
- Quem não é Membro recebe 404 `conversation_not_found`.
- Sem Sessão, recebe 401.

**Teste previsto:** e2e da API, `test/conversation-members.e2e-spec.ts`: "devolve os Membros em
ordem alfabética", "responde 404 para quem não é Membro" e "responde 401 sem Sessão".

### CA3

**Marca:** teste no Playwright

**Cenário:** Dado um Canal com três Membros, então o cabeçalho mostra o botão "Membros: 3", que
abre a lista.

**Teste previsto:** Playwright, `e2e/canais-privados/lista-de-membros.spec.ts`, "o cabeçalho mostra
a quantidade e abre a lista".

### CA4

**Marca:** teste no Playwright

**Cenário:**
- Dada a lista aberta, então ela mostra cada Membro, com "(você)" ao lado da Pessoa da Sessão.
- No Canal privado, "Adicionar pessoas" abre o passo da T04; adicionar volta à lista, já com a
  Pessoa nova.
- No público, o botão não aparece.

**Teste previsto:** Playwright, `e2e/canais-privados/lista-de-membros.spec.ts`, "a lista mostra
os Membros com (você) e adiciona pelo passo", e `e2e/canais-publicos/membros-do-canal-publico.spec.ts`,
"no Canal público não há Adicionar pessoas".

### CA5

**Marca:** teste HTTP

**Cenário:** Os testes de CA2.

**Teste previsto:** os de CA2.

### CA6

**Marca:** teste no Playwright

**Cenário:** Dadas duas Pessoas no mesmo Canal privado, a segunda com a lista de Membros aberta,
quando a primeira adiciona uma terceira pela lista, então a quantidade no cabeçalho e a lista da
segunda mudam sem recarregar.

**Teste previsto:** Playwright, `e2e/canais-privados/lista-de-membros.spec.ts`, "a quantidade e a
lista mudam sem recarregar na aba da outra Pessoa".

### CA7

**Marca:** documento

**Cenário:** Quem revisa encontra nesta pasta `validacao-visual.md`, com as capturas da lista de
Membros (pública e privada) e do cabeçalho nos dois temas, ao lado dos frames do Figma.

### CA8

**Marca:** documento

**Cenário:** Quem revisa encontra nesta pasta `roteiro-manual.md`, com os passos para a nota 100 de
Acessibilidade do Lighthouse no diálogo "Criar canal", no passo "Adicionar pessoas" e na lista de
Membros, a rodar por uma pessoa, como os roteiros das funcionalidades anteriores. A checagem do axe
nos três, sem violações, está nos testes do Playwright.

## Contrato

### GET /v1/conversations/:id/members · nova

| Item | O que descreve |
| --- | --- |
| Autenticação | Sessão, pelo cookie |
| Resposta de sucesso | 200 com `members`: `id`, `name`, em ordem alfabética do pt-BR |
| Erros | 401 `unauthenticated`; 404 `conversation_not_found` |

### BFF: `GET /api/conversations/:id/members` · nova

| Item | O que descreve |
| --- | --- |
| Rota da API | `GET /v1/conversations/:id/members` |
| Resposta de sucesso | 200 com os Membros no formato da web (`id`, `name`, `initials`) |
| Erros | 401, 404 e 502, como a rota de Mensagens da F02 |

## Verificação do contrato

- `GET /v1/conversations/:id/members` 200, 401 e 404: CA2.
- `GET /api/conversations/:id/members`: CA4 e CA6.

## Decisões

- A rota fica no controller de Conversas: ela só lê, e o service de Conversas já usa o de Pessoas
  para os nomes.
- O cabeçalho passa a um componente cliente pequeno (`MembersButton`) que lê a quantidade do cache
  da lista de Conversas da T03, pela mesma chave (com a Pessoa), com a Conversa do servidor como
  ponto de partida.
- A lista é o `MembersDialog`: busca os Membros ao abrir e de novo a cada `conversation.member_added`
  daquela Conversa enquanto está aberta. No Canal privado, "Adicionar pessoas" troca o conteúdo do
  mesmo diálogo pelo `AddPeopleStep`, e adicionar ou voltar mostra a lista de novo.
- O `AddPeopleStep` ganha o texto do botão secundário por prop: "Pular" na criação e "Voltar" na
  lista de Membros, e quem o usa decide o que acontece ao fechar.
- O botão do cabeçalho mostra o ícone de Pessoas e a quantidade, com o nome acessível "Membros: N".

## Arquivos e interfaces

- `apps/chat-api/src/conversations/conversations.service.ts`: `listMembers`.
- `apps/chat-api/src/conversations/conversations.controller.ts`: a rota.
- `apps/web/src/app/services/chat-api.ts`: `listMembers`.
- `apps/web/src/app/api/conversations/[id]/members/route.ts`.
- `apps/web/src/app/components/conversation/members-button.tsx` e `members-dialog.tsx`.
- `apps/web/src/app/components/conversation/conversation-header.tsx` e a página da Conversa.
- `apps/web/src/app/components/conversation/add-people-step.tsx`: o texto do botão secundário.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum.
