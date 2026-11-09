# Spec · F02 · Mensagens em canal público

2026-11-09 · Luiz Carlos · Status: pronta · PRD: [prd.md](prd.md)

Como a F02 será construída. O que a Pessoa consegue fazer, os critérios de aceite e o que não é
objetivo estão no PRD. As convenções transversais, os valores e as regras já registradas estão no
[LLD](../../lld.md), e esta spec aponta para eles em vez de repeti-los.

## Problema

Depois da F01 a Pessoa entra no chat, mas não tem onde conversar. Sem Canais e Mensagens, nenhuma
outra funcionalidade tem onde acontecer (PRD, seção 1, "Resumo executivo").

## Solução

A Pessoa vê os Canais públicos na barra lateral, abre um deles, lê o histórico das Mensagens mais
recentes até a primeira e envia Mensagens de texto. Quem opera a instalação cria os Canais por um
comando da API do chat, e toda Pessoa é Membro de todos os Canais públicos. O fluxo completo está
no PRD, seção 2, "Fluxo".

## Histórias de usuário

As histórias 1 a 7 do PRD (seção 2, "Histórias de usuário") valem como estão, com os critérios de
aceite de lá. Esta spec acrescenta as de quem opera a instalação, que o PRD deixa fora do produto:

8. Como operação, quero criar um Canal público com nome e Tópico, para o time ter onde conversar.
9. Como operação, quero trocar o Tópico de um Canal, para ele continuar descrevendo a conversa.
10. Como operação, quero listar os Canais, para conferir o que já existe antes de criar outro.
11. Como operação, quero que a conta que eu criar já seja Membro de todos os Canais públicos, para a
    Pessoa não depender de outro passo para conversar.

## Decisões de implementação

### Conversas e participação (API do chat)

Canal público, Canal privado e Conversa direta ficam numa tabela só, e toda participação é gravada,
inclusive a de Canal público ([ADR 0024](../../adr/0024-conversas-numa-tabela-so.md)). A F02 cria
só o tipo `public_channel`; a F04 e a F05 acrescentam os outros.

Tabela `conversations`, `planejada`:

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | UUID v7 ([ADR 0022](../../adr/0022-uuid-v7.md)) |
| `kind` | texto | `CHECK` com os tipos existentes; na F02, só `public_channel` |
| `name` | texto, opcional | Obrigatório em Canal; único entre os Canais (índice único parcial onde não é nulo). Regra do nome em "Comando de canais" |
| `topic` | texto, opcional | Até 250 caracteres, numa linha |
| `created_at`, `updated_at` | timestamptz | Convenção do LLD, seção "Dados" |

Tabela `conversation_members`, `planejada`:

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | UUID v7 |
| `conversation_id` | uuid | Referência a `conversations`; apagar a Conversa apaga as participações |
| `person_id` | uuid | Referência a `people`, com índice; apagar a Pessoa apaga as participações |
| `created_at`, `updated_at` | timestamptz | Convenção do LLD |

Unicidade em (`conversation_id`, `person_id`). A última leitura e os contadores da F07
([ADR 0021](../../adr/0021-contadores-gravados.md)) entram nesta tabela, na F07.

- **Conferência de acesso:** o service de Conversas tem uma operação só, "Conversa da qual a Pessoa
  é Membro", que devolve a Conversa ou lança `conversation_not_found`. Toda rota e todo service que
  recebe um id de Conversa passa por ela, e a F03 a reaproveita no WebSocket. Isso fecha, no LLD, o
  lugar da conferência de participação: no service, e não num guard.
- **Conversa inexistente, sem participação ou com id malformado** recebem o mesmo
  `conversation_not_found` (404), sem distinguir os casos. O id malformado não chega ao banco nem
  vira `validation_failed`.
- **Toda Pessoa em todo Canal público:** criar um Canal público grava a participação de todas as
  Pessoas, e criar uma conta grava a participação da Pessoa em todos os Canais públicos, cada um
  numa transação. As duas transações começam tomando a mesma trava transacional do Postgres
  (`pg_advisory_xact_lock` com uma chave fixa), para uma conta e um Canal criados ao mesmo tempo não
  deixarem a Pessoa fora do Canal. A gravação tolera a participação que já existe.

### Mensagens (API do chat)

Tabela `messages`, `planejada`:

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | UUID v7, que dá a ordem da Conversa |
| `conversation_id` | uuid | Referência a `conversations` |
| `author_id` | uuid | Referência a `people`. Autor bot fica para a F11 (LLD, "Questões em aberto", "Bots na mesma tabela das pessoas") |
| `client_id` | uuid | Identificador gerado no cliente |
| `body` | texto | `CHECK (char_length(body) BETWEEN 1 AND 4000)` |
| `created_at`, `updated_at` | timestamptz | Convenção do LLD; `created_at` é a hora mostrada na tela |

- Índice em (`conversation_id`, `id`) para a paginação, e unicidade em (`author_id`, `client_id`)
  para o envio sem duplicar (LLD, seção "Concorrência e idempotência").
- `deleted_at`, citação e a marca "dados de negócio" entram com as funcionalidades que os usam (F06,
  F13).
- **Texto:** a API remove os espaços e as quebras de linha das pontas e então valida. Vazio é
  recusado, e o limite é de 4000 caracteres, contados como pontos de código Unicode, igual ao
  `char_length` do Postgres e ao contador da caixa de mensagem na web. Um emoji conta 1.
- **Envio repetido:** o mesmo `client_id` do mesmo autor devolve a Mensagem já gravada, com o mesmo
  201, sem gravar outra (LLD, seção "Concorrência e idempotência"). O texto do reenvio é ignorado.

### Rotas (API do chat)

Todas `planejadas`, autenticadas pelo guard da F01 e com o corpo de erro da rule de erros da API
(`.claude/rules/nest-api-errors.md`). Sem Sessão, todas respondem `unauthenticated` (401).

| Rota | Entrada | Sucesso | Erros |
| --- | --- | --- | --- |
| `GET /v1/conversations` | — | 200 com `conversations`: as Conversas de que a Pessoa é Membro, com `id`, `kind`, `name`, `topic`, em ordem alfabética do nome | — |
| `GET /v1/conversations/:id` | — | 200 com `conversation` | `conversation_not_found` (404) |
| `GET /v1/conversations/:id/messages` | `before` (id de Mensagem, opcional), `limit` (LLD, "Valores e configuração", "Tamanho da página") | 200 com `messages` em ordem cronológica e `has_more` | `conversation_not_found` (404), `validation_failed` (400) |
| `POST /v1/conversations/:id/messages` | `client_id` (uuid), `body` | 201 com `message` | `conversation_not_found` (404), `validation_failed` (400) |

- **Mensagem na resposta:** `id`, `conversation_id`, `client_id`, `author` (`id`, `name`), `body` e
  `created_at`.
- **Paginação:** a convenção do LLD, seção "Interfaces". Sem `before`, vêm as Mensagens mais
  recentes. Um `before` que não é uuid, ou um `limit` fora da faixa, recebe `validation_failed`.
- O código novo, `conversation_not_found`, entra no catálogo de códigos e nos mapas de status e de
  `detail` do filter global.

### Módulos (API do chat)

- `conversations`: as duas entidades, o service (listar as Conversas da Pessoa, Conversa da qual a
  Pessoa é Membro, criar Canal público, trocar Tópico, listar Canais, incluir uma Pessoa em todos os
  Canais públicos) e o controller das duas primeiras rotas. A regra do nome do Canal é uma função
  pura.
- `messages`: a entidade, o service (página do histórico e envio, os dois passando pela conferência
  de acesso) e o controller das rotas de Mensagens.
- **Transação entre módulos:** `@nestjs-cls/transactional`, com o adaptador do TypeORM. A transação
  começa no método do service que orquestra, marcado com `@Transactional()`, e os services que
  participam dela acessam o banco pelo `TransactionHost`, e não pelo repositório injetado. O
  `PeopleService` passa a usar o `TransactionHost` na tarefa que liga a criação de conta aos
  Canais. Isso fecha, no LLD, "Onde a transação começa e como passa entre módulos". A tarefa
  confere a compatibilidade da biblioteca com o TypeORM 1.x e como abrir o contexto do CLS nos
  comandos, que rodam fora do HTTP.

### Comando de canais (API do chat)

Um script da API do chat, no mesmo padrão do comando de contas (spec da F01, "Comando de contas"):
sobe o contexto do Nest sem HTTP e chama o service de Conversas.

| Operação | Recebe | Efeito |
| --- | --- | --- |
| `create` | Nome; Tópico opcional | Cria o Canal público com a participação de todas as Pessoas. Nome já existente ou inválido é recusado com mensagem |
| `set-topic` | Nome; Tópico (vazio apaga) | Troca o Tópico |
| `list` | — | Lista os Canais, com nome, Tópico e número de Membros |

- **Nome do Canal:** de 1 a 80 caracteres, em minúsculas, só com letras (inclusive acentuadas),
  dígitos, `-` e `_`, sem espaços nem `#`. O comando normaliza o nome para NFC antes de validar. A
  F04 herda a mesma regra.
- **Tópico:** até 250 caracteres, sem quebra de linha.
- **Conta nova:** a operação `create` do comando de contas passa a incluir a Pessoa em todos os
  Canais públicos, na mesma transação que cria a Pessoa (história 11).
- O comando entra no `AGENTS.md` da API, seção "Comandos", na tarefa que o implementa.

### BFF e telas (web)

**Endereços e dados**

- **Endereço da Conversa:** `/conversas/<id>`, uma rota sob o layout das telas logadas. O
  `?para=` da F01 vale para ele sem mudança.
- **Services:** as quatro rotas da API entram no service HTTP do web
  (`apps/web/AGENTS.md`, "API Externas"), com o mesmo retorno em união discriminada da F01 (`ok`,
  `unauthenticated`, `not_found`, `failure`). O service monta o autor de cada Mensagem com as
  iniciais calculadas no servidor, como a `Person` da F01.
- **Pessoa da Sessão nas páginas:** a leitura da Pessoa da Sessão é memorizada por requisição
  (`cache` do React), e a página da Conversa a reaproveita sem nova chamada à API. A página precisa
  dela para mostrar a Mensagem que está sendo enviada.
- **Leituras:** a lista de Conversas e a primeira página do histórico vêm dos Server Components. As
  páginas anteriores vêm do cliente por uma rota do BFF, `GET /api/conversations/:id/messages`, com
  `before`. No cliente, o histórico fica num `useSWRInfinite`, com a primeira página como
  `fallbackData`, e é o cache que a F03 atualiza pelos eventos (LLD, seção "Cliente"). O SWR entra
  como dependência na F02.
- **Envio:** um Server Action, como o LLD prevê, que valida o texto como a API e chama o service. A
  caixa de mensagem gera o `client_id` com `crypto.randomUUID()` e mostra a Mensagem como
  "enviando", num estado do cliente fora do cache do SWR, que guarda só as Mensagens gravadas. O
  cliente manda uma Mensagem por vez, numa fila, para a ordem gravada ser a do envio. Confirmada pela
  API, a Mensagem sai do estado do cliente e entra no cache. Na falha, ela fica como "falhou";
  "Tentar de novo" reenvia com o mesmo `client_id`, e "Descartar" a tira do estado do cliente. As
  Mensagens "enviando" e "falhou" ficam sempre no fim da lista, depois das gravadas.
- **401** na rota do BFF ou no Server Action leva a `GET /api/session/expired` com o `?para=` da
  Conversa, como na F01 (LLD, "Cliente", "Sessão no cliente").

**Cookies do navegador:** a última Conversa e o fuso, com as regras no LLD, seção "Cliente",
"Cookies do cliente". A Home redireciona pela última Conversa, como na tabela de telas do LLD, e,
sem nenhuma Conversa, mostra "Home / Vazio" (19:1645), como já faz. A nova renderização depois de
regravar o fuso é um `router.refresh()`.

**Telas**, que reproduzem as seções Casca e Conversa do Figma:

- **Barra lateral:** a seção "Canais" (Casca / Sidebar / Com dados, 25:20064) com SidebarSection e
  SidebarRow. A seção recolhe e expande (25:20813). A linha da Conversa aberta fica ativa, num
  componente cliente pequeno que lê o segmento da rota. Enquanto a lista carrega, aparece o
  esqueleto (25:19071), num `Suspense` só da barra lateral. Se a lista falha, aparece o erro da
  barra lateral com "Tentar de novo" (25:19177), que refaz a renderização. Ficam de fora "Adicionar
  canal", Mensagens diretas, Agentes e o ícone de nova mensagem do cabeçalho.
- **Home:** enquanto decide para onde ir, mostra "Home / Carregando" (19:1533). Se a lista de
  Conversas falha, mostra "Conversa / Erro ao carregar a lista" (26:46375), a versão certa da seção
  "Erros corretos".
- **Conversa** (Conversa / Estrutura / Canal público, 21:2843):
  - ConversationHeader com `#`, nome e Tópico, sem o botão de Membros.
  - Enquanto carrega, "Conversa / Estrutura / Histórico carregando" (21:1869). Se a Conversa ou a
    primeira página falham, "Conversa / Lista / Erro ao carregar" (21:4642), com "Tentar de novo";
    o cabeçalho mostra o nome quando a Conversa carregou.
  - Conversa não encontrada: `notFound()` da rota, com a tela 21:1987. O status HTTP fica 200: o
    layout logado já começou a resposta no streaming (o `Suspense` da verificação da Sessão)
    quando a página descobre que a Conversa não existe, e num app logado, sem indexação, o que
    importa é a tela.
  - Ao abrir, a lista rola até a última Mensagem e o foco vai para a caixa de mensagem.
- **Lista de Mensagens:** MessageItem completo (22:6386) ou compacto (22:7404), DayDivider e, no
  começo, ConversationIntro (21:4808). A lista é um `<ol>` com rótulo, dentro de uma área de
  rolagem que recebe foco, para rolar pelas setas e por Page Up e Page Down.
  - Carga das anteriores: um sentinela no topo, observado por `IntersectionObserver`, dispara a
    próxima página quando chega a 300 px da área visível, com o indicador 21:6830. O link
    "Carregar mensagens anteriores" (21:6069) faz o mesmo e é o caminho do teclado. Depois de
    acrescentar a página, o cliente devolve a rolagem à mesma Mensagem (mede a altura antes e
    depois), sem depender do `overflow-anchor` do navegador.
  - Falha da carga das anteriores: as Mensagens ficam, e o link volta a aparecer para tentar de novo.
  - Mensagem "enviando" (22:11072) e "falhou" (22:12030), com "Tentar de novo" e "Descartar".
  - A barra de ações no hover, menções e citação ficam de fora (F06).
- **Funções puras do histórico**, testadas com Vitest (ver "Decisões de teste"):
  - Forma compacta: mesmo autor da Mensagem anterior, no mesmo dia do fuso e dentro do `intervalo
    da forma compacta` (LLD, "Valores e configuração").
  - Rótulo do divisor: "Hoje", "Ontem", a data sem o ano ("3 de novembro") no ano corrente e com o
    ano ("3 de novembro de 2025") nos anteriores.
  - Hora: horas e minutos, em 24 h ("14:10").
  - Links: só `http://` e `https://`, sem a pontuação final (`.`, `,`, `;`, `:`, `!`, `?`) e sem o
    `)` final que não abriu dentro do link. O link abre em outra aba, com
    `rel="noopener noreferrer"`. O resto do texto é renderizado como texto, com
    `white-space: pre-wrap`, e nunca como HTML.
  - Contagem de caracteres: pontos de código, como a API.
- **Caixa de mensagem** (MessageComposer: vazia 23:12257, com texto 23:13024, acima do limite
  23:13781): "Mensagem para #nome", Enter envia (fora da composição de IME), Shift+Enter quebra a
  linha, e o botão de enviar fica desabilitado com o texto vazio ou acima do limite. O botão `@` de
  menções fica de fora (F06). Ao enviar, a caixa esvazia e a lista rola até o fim.
- **Gaveta abaixo de `md`:** o Rail e a barra lateral viram uma gaveta (Dialog do Radix), aberta por
  um IconButton no ConversationHeader e na Home, como o `docs/design-system.md` prevê na seção
  "Layout e responsividade". O link de um Canal fecha a gaveta.
- **Mudança no Figma, antes do código da gaveta:** criar o frame "Casca / Gaveta / Aberta", em 767
  de largura, com a gaveta aberta sobre a Conversa e o IconButton no cabeçalho, e o ícone
  `icon/menu` na seção Ícones se ele ainda não existir (`docs/design-system.md`, "Do código para o
  Figma" e "Ícones"). A situação da gaveta no `docs/design-system.md` muda na mesma tarefa.

### Tempo real

A F02 não sobe o WebSocket. As Mensagens dos outros aparecem ao abrir a Conversa de novo ou
recarregar a página (PRD, história 3). O cache do SWR e a conferência de acesso no service são os
pontos em que a F03 se liga.

## Decisões de teste

**O que faz um bom teste aqui:** o teste prova o comportamento externo (a resposta HTTP, a linha no
banco, o que aparece na tela), e não a forma interna dos services. A forma de cada teste está em
`.claude/rules/nest-api-testing.md`.

**API do chat, testes de ponta a ponta por HTTP com banco real.** São o seam principal das regras.

- Lista: devolve só as Conversas de que a Pessoa é Membro, em ordem alfabética.
- Conversa: 200 para Membro; 404 `conversation_not_found` para id inexistente, id malformado e
  Pessoa sem participação (a participação é apagada no Arrange), com o mesmo corpo.
- Histórico: sem `before`, as mais recentes em ordem cronológica; com `before`, as anteriores;
  `has_more` verdadeiro e falso; o padrão e o máximo do `tamanho da página`, e `limit` fora da faixa
  com `validation_failed`; `before` malformado com `validation_failed`.
- Envio: 201 com o autor da Sessão; texto com as pontas removidas; exatamente 4000 caracteres com
  emojis aceitos, e 4001 recusados; vazio e só espaços recusados; o mesmo `client_id` devolve a
  mesma Mensagem e não grava outra linha; Pessoa sem participação recebe 404.
- Sem Sessão, as quatro rotas respondem 401.

Os testes usam nomes de Canal únicos e conferem só os próprios Canais, porque criar um Canal
público inclui todas as Pessoas do banco de testes.

**Comandos, testes de integração contra o banco de testes:**
- canais: `create` com a participação de todas as Pessoas, nome repetido e nome inválido recusados,
  `set-topic` (inclusive apagar) e `list`;
- contas: `create` inclui a Pessoa em todos os Canais públicos.

**Unidade na API:** a regra do nome do Canal, função pura com muitos casos.

**Base de testes da API, acrescentada na F02:** `uniqueChannelName()` e atalhos para criar Canal
pelo service e Mensagens direto no banco, com o `id` UUID v7 gerado na hora pedida, para montar
históricos com datas.

**Web, Vitest para as funções puras** listadas em "BFF e telas": forma compacta, rótulo do divisor,
hora, links e contagem de caracteres, com o fuso passado como parâmetro. O Vitest entra no projeto
`web` só para elas, em ambiente Node, e o comando entra na "Verificação completa" do
`apps/web/AGENTS.md`. Isso muda a linha de testes do LLD, seção "Estrutura do código".

**Web, testes de ponta a ponta com o Playwright**, escritos pelo fluxo da skill `playwright-cli`,
com o plano de testes da F02 junto dos testes, como na F01. Cobrem:
- a lista de Canais na barra lateral, a abertura de um Canal pelo clique e pelo teclado, o
  cabeçalho com nome e Tópico e a seção recolhida;
- a Home abre a última Conversa visitada; na primeira visita, a primeira da lista; sem Conversa,
  "Nenhuma conversa ainda";
- o histórico abre nas Mensagens mais recentes; rolar até o topo carrega as anteriores sem mudar a
  Mensagem visível; o link "Carregar mensagens anteriores" pelo teclado; o começo do Canal;
- a forma compacta e o divisor de dia, com Mensagens montadas em datas conhecidas;
- enviar: a Mensagem aparece, continua depois de recarregar e mostra o autor; Enter e Shift+Enter;
  o botão desabilitado com texto vazio; o contador acima do limite;
- falha no envio: o envio é abortado por `page.route`; "Tentar de novo" grava uma Mensagem só;
  "Descartar" a tira da lista;
- o link `http(s)` abre em outra aba, e um texto com marcação aparece como texto;
- o endereço de um Canal sem Sessão leva a "Entrar" e volta para ele; o endereço inexistente mostra
  "Conversa não encontrada"; voltar e avançar do navegador;
- a gaveta em 767 de largura;
- a checagem de acessibilidade com `@axe-core/playwright` na Conversa, na Home vazia e na gaveta,
  sem violações.

**Base dos testes da web, acrescentada na F02:** a fixture `channel` cria o Canal direto no banco,
com nome `e2e-` e só as participações das Pessoas que o teste passa; uma fixture cria Mensagens com
datas conhecidas. A Pessoa da fixture `person` da F01 é gravada direto no banco e não entra em
nenhum Canal, e é isso que isola cada teste dos Canais de outros testes e do desenvolvimento, e que
permite testar a Home vazia. É um desvio de propósito da regra "toda Pessoa em todo Canal público",
que vale só para os dados de teste.

**Verificações do agente com o `playwright-cli`**, registradas na pasta da tarefa da tela:
- **Erro da lista e do histórico:** com a API do chat parada, a verificação da Sessão também
  falha, e o layout mostra "Não foi possível verificar sua sessão" em vez das telas de erro. Por
  isso o agente provoca a falha só nas rotas de Conversas e de Mensagens, com a verificação da
  Sessão funcionando: renomeia a tabela `conversations` no banco de desenvolvimento, abre a Home e
  um Canal, confere as telas de erro, desfaz o nome e confere o "Tentar de novo".
- **Validação visual:** capturas em 1440 × 900, nos dois temas, comparadas com o `get_screenshot`
  dos frames citados (`docs/design-system.md`, "Validação visual"), e a gaveta em 767.

**Medição, registrada na pasta da tarefa do histórico** (`medicao-p95.md`): um Canal com 100 mil
Mensagens, criado por SQL no banco de desenvolvimento e apagado depois. Registra o p95 de 200
chamadas à primeira página e a uma página do meio do histórico, direto na API, e o tempo até as
Mensagens aparecerem na tela ao abrir o Canal e ao carregar as anteriores. O critério é o do PRD,
história 4: até 1 s no p95.

**Roteiro manual, feito por uma pessoa e registrado na mesma pasta:** a nota 100 de Acessibilidade
do Lighthouse na Conversa, pelo Chrome DevTools.

**Exemplos anteriores:** os testes da F01, nas mesmas pastas e com as mesmas bases.

## Fora de escopo

- Tudo o que o PRD lista em "O que não é objetivo".
- O WebSocket e a atualização do cache por eventos (F03).
- Os tipos `private_channel` e `direct`, renomear e apagar Canal.
- Autor bot nas Mensagens e a decisão de onde os bots ficam (F10, F11).
- O snapshot OpenAPI das rotas novas, que segue planejado no LLD.
- Virtualização da lista de Mensagens: com o `tamanho da página` do LLD, a F02 não a precisa. Volta como pergunta
  se a medição mostrar lentidão na rolagem.

## Observações

- A F02 fecha questões em aberto do LLD: Canais e Conversas diretas numa tabela só
  ([ADR 0024](../../adr/0024-conversas-numa-tabela-so.md)), o lugar da conferência de participação,
  onde a transação começa e como passa entre módulos, a paginação do histórico e das listas e o
  tamanho da página. O registro está no LLD, nas seções correspondentes.
- O glossário ganhou Conversa, Canal, Conversa direta, Tópico e Mensagem.
- Os nós do Figma citados vieram do levantamento feito para esta spec (arquivo `slack`, página
  Telas) e podem mudar de id se os frames forem recriados. Nesse caso, valem os nomes.
