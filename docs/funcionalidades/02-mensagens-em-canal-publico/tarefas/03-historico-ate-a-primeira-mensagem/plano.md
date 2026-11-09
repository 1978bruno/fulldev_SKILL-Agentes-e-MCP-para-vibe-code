# Plano da F02-T03: Histórico até a primeira Mensagem

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste HTTP

**Cenário:** Dado um Canal com mais Mensagens que uma página, quando a Pessoa pede as Mensagens com
`before` igual ao id da mais antiga recebida, então recebe as anteriores em ordem cronológica, com
`has_more`. Dado um `before` que não é uuid, ou um `limit` fora da faixa, então recebe 400
`validation_failed`.

**Teste previsto:** e2e da API, `test/messages.e2e-spec.ts`, "devolve as Mensagens anteriores a
before, em ordem cronológica", "respeita o limit pedido", e "recusa before ou limit inválidos com
validation_failed".

### CA2

**Marca:** teste no Playwright

**Cenário:** Dado um Canal com mais de uma página, quando a Pessoa rola até o topo, então o
navegador busca a página anterior pela rota do BFF. Dado que a Sessão foi revogada, quando a
Pessoa pede as anteriores, então vai para "Entrar" com o `?para=` da Conversa.

**Teste previsto:** Playwright, `e2e/conversa/rolar-ate-o-comeco.spec.ts` (a página anterior
chega pela rota do BFF) e `e2e/conversa/anteriores-com-sessao-revogada.spec.ts`.

### CA3

**Marca:** teste no Playwright

**Cenário:** Dado um Canal com duas páginas, quando a Pessoa rola até o topo, então o indicador
de carga aparece, as anteriores entram acima, e a Mensagem que estava no topo da tela continua no
mesmo lugar.

**Teste previsto:** Playwright, `e2e/conversa/rolar-ate-o-comeco.spec.ts`.

### CA4

**Marca:** teste no Playwright

**Cenário:** Dado um Canal com duas páginas, quando a Pessoa chega ao link "Carregar mensagens
anteriores" pelo teclado e aperta Enter, então as anteriores carregam. A área de rolagem recebe o
foco e rola pelas teclas.

**Teste previsto:** Playwright, `e2e/conversa/carregar-anteriores-pelo-teclado.spec.ts`.

### CA5

**Marca:** teste no Playwright

**Cenário:** Dado que a carga das anteriores falha (a rota do BFF é abortada por `page.route`),
então as Mensagens carregadas ficam e o link volta; com a rota liberada, o link carrega as
anteriores.

**Teste previsto:** Playwright, `e2e/conversa/falha-ao-carregar-anteriores.spec.ts`.

### CA6

**Marca:** teste no Playwright

**Cenário:** Dado um Canal sem Mensagens, então a lista mostra só "Este é o começo do canal #nome"
com o Tópico. Dado um Canal com duas páginas, quando a Pessoa chega à primeira Mensagem, então o
mesmo começo aparece acima dela.

**Teste previsto:** Playwright, `e2e/conversa/canal-sem-mensagens.spec.ts` e
`e2e/conversa/rolar-ate-o-comeco.spec.ts`.

### CA7

**Marca:** teste HTTP

**Cenário:** Dado um Canal com três páginas, quando a Pessoa encadeia as páginas pelo `before`,
então recebe o histórico inteiro, sem repetir nem pular Mensagens, com `has_more` falso só na
última. Sem `limit`, a página tem o padrão; com `limit` 100, até 100.

**Teste previsto:** e2e da API, `test/messages.e2e-spec.ts`, "as páginas encadeadas cobrem o
histórico inteiro sem repetir nem pular" e "usa o tamanho padrão e aceita o máximo".

### CA8

**Marca:** teste no Playwright

**Cenário:** O de CA3, CA4 e CA6, com o histórico montado pela fixture de Mensagens.

**Teste previsto:** os de CA3, CA4 e CA6.

### CA9

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quem revisa encontra `medicao-p95.md`, com o p95 da
primeira página e de uma página do meio, direto na API, e o tempo até as Mensagens aparecerem na
tela, num Canal com 100 mil Mensagens, e o veredito contra o critério do PRD (história 4).

### CA10

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quem revisa encontra `validacao-visual.md`, com
"Carregando anteriores" (21:6830), "Carregar mensagens anteriores" (21:6069) e "Início do canal"
(21:4808), nos dois temas, ao lado das capturas do Figma.

## Contrato

### GET /v1/conversations/:id/messages · alterada

| Item | Antes | Depois |
| --- | --- | --- |
| Parâmetros de consulta | Nenhum | `before` (uuid, opcional): Mensagens anteriores a esta; `limit` (inteiro de 1 ao máximo do `tamanho da página`, opcional, padrão do `tamanho da página`) |
| Resposta de sucesso | A página mais recente | As `limit` Mensagens anteriores a `before`, ou as mais recentes sem ele, em ordem cronológica, com `has_more` |
| Erros | 401, 404 | 400 `validation_failed` (`before` que não é uuid, `limit` fora da faixa ou não inteiro); 401; 404 |

### GET /api/conversations/:id/messages (BFF) · nova

| Item | Descrição |
| --- | --- |
| Autenticação | Cookie de sessão, repassado à API |
| Parâmetros de consulta | `before` (opcional), repassado |
| Chama | `GET /v1/conversations/:id/messages?before=` |
| Resposta de sucesso | 200 `{ messages: Message[], hasMore }`, as Mensagens já com as iniciais do autor |
| Erros | 401 sem Sessão ou com a Sessão recusada; 404 Conversa não encontrada; 502 falha da API |

## Verificação do contrato

- `GET /v1/conversations/:id/messages` com `before` e `limit`: CA1 e CA7; 400: CA1.
- Rota do BFF: 200 em CA2 e CA3; 401 em CA2. O 404 e o 502 não têm teste: o 404 só acontece se a
  participação for apagada com a Conversa aberta, e o 502 é o mesmo caminho da falha de CA5, que
  aborta a rota.

## Decisões

- **Validação da consulta:** um DTO de consulta com `class-validator`, com o `limit` convertido
  para número pelo `class-transformer` (`@Type`). `before` é comparado só pelo id: um id de outra
  Conversa devolve as Mensagens desta anteriores àquele instante, sem erro, porque o id não revela
  nada.
- **Chave do SWR:** `pages[0]` continua a página mais recente; a página `n` tem a chave
  `["messages", id, <id da Mensagem mais antiga da página n-1>]` e só existe enquanto a anterior
  tem `has_more`.
- **Rota do BFF com corpo já no formato da web:** a resposta leva `Message` (camelCase, com
  iniciais), para o cliente não conhecer o formato da API.
- **Rolagem preservada:** antes de pedir a página, o cliente guarda `scrollHeight - scrollTop`; no
  `useLayoutEffect` da troca da primeira Mensagem, devolve o `scrollTop`. Sem `overflow-anchor`,
  como a spec pede.
- **Sentinela:** `IntersectionObserver` com a área de rolagem como raiz e `rootMargin` de 300 px no
  topo; ele não dispara enquanto uma página está a caminho nem depois de uma falha, que espera o
  link.
- **Medição:** feita com um Canal de 100 mil Mensagens criado por SQL no banco de desenvolvimento,
  com a Pessoa da medição como Membro, e apagado no fim. A API é medida com 200 chamadas sequenciais
  por `curl`, e a tela com o Playwright, do `goto` até a última Mensagem visível e do topo até a
  página anterior aparecer.

## Arquivos e interfaces

API (`apps/chat-api`):
- `src/messages/list-messages.query.ts`: o DTO de consulta.
- `src/messages/messages.service.ts`: `listLatest` vira `listPage(personId, conversationId, { before, limit })`.
- `src/messages/messages.controller.ts`: lê o DTO de consulta.

Web (`apps/web`):
- `src/app/services/chat-api.ts`: `listMessages(token, id, { before })`; `listLatestMessages` chama ela.
- `src/app/api/conversations/[id]/messages/route.ts`: a rota do BFF.
- `src/app/hooks/use-message-history.ts`: a chave das páginas anteriores, o fetcher pela rota do
  BFF, `loadOlder`, `isLoadingOlder`, `hasOlder` e `olderError`.
- `src/app/components/conversation/message-history.tsx`: o sentinela, o link, o indicador, o
  começo do Canal e a rolagem preservada.
- `src/app/components/conversation/conversation-intro.tsx`: o ConversationIntro.
- `e2e/conversa/`: os testes de CA2 a CA6; `e2e/plano-de-testes-f02.md`: os cenários.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum: o LLD já registra a paginação, o tamanho da página e a rota do BFF.
