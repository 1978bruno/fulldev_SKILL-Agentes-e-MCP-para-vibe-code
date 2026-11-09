# Spec · F03 · Tempo real

2026-11-09 · Luiz Carlos · Status: pronta · PRD: [prd.md](prd.md)

Como a F03 será construída. O que a Pessoa consegue fazer, os critérios de aceite e o que não é
objetivo estão no PRD. As convenções transversais, os valores e as regras já registradas estão no
[LLD](../../lld.md), e esta spec aponta para eles em vez de repeti-los.

## Problema

Depois da F02 a Pessoa só vê o que os outros escreveram ao reabrir o Canal ou recarregar a página,
e não sabe se alguém está respondendo. Uma queda de conexão passa despercebida (PRD, seção 1,
"Resumo executivo").

## Solução

A web abre, por aba, um WebSocket direto na API do chat ([ADR 0002](../../adr/0002-next-bff-websocket-direto.md)),
pelo Socket.IO ([ADR 0019](../../adr/0019-socket-io-tempo-real.md)). Cada Mensagem gravada vira um
evento para cada Membro da Conversa, guardado no Redis por Pessoa e emitido para as abas dela. Ao
reconectar, a aba informa o último evento que recebeu e a API reenvia os seguintes (HLD 6.2). O
"digitando" passa só entre as abas que estão com a Conversa aberta, sem ser guardado. O fluxo
completo está no PRD, seção 2, "Fluxo".

## Histórias de usuário

As histórias 1 a 6 do PRD (seção 2, "Histórias de usuário") valem como estão, com os critérios de
aceite de lá. O tempo máximo da história 6, que o PRD deixa "A definir", é o `intervalo de
reconferência da Sessão no WebSocket` (LLD, "Valores e configuração").

## Decisões de implementação

### Conexão (API do chat)

- **Gateway:** `@nestjs/websockets` com `@nestjs/platform-socket.io`, no mesmo servidor HTTP da API,
  no caminho padrão `/socket.io`. A API roda com uma instância só (HLD 6.2), então não há adaptador
  entre instâncias.
- **Transporte:** só `websocket`, no servidor e no cliente, sem o long-polling inicial do Socket.IO.
  O produto é só para navegador de desktop, e assim os testes conseguem interceptar a conexão pelo
  `routeWebSocket` do Playwright, que não vê o polling.
- **Origem e cookie:** CORS com `origin` igual a `WEB_ORIGIN` e `credentials: true`; o cliente abre
  com `withCredentials: true`. O handshake de outra origem é recusado. Localmente, o cookie de
  `localhost` vale para as duas portas (LLD, "Ambiente de desenvolvimento").
- **Ping:** o `ping do WebSocket` (LLD, "Valores e configuração"), menor que o padrão do Socket.IO,
  para a queda sem fechamento da conexão (Wi-Fi que some, computador suspenso) ser percebida em até
  15 s, e não nos 45 s do padrão.

**Salas**

| Sala | Quem entra | O que recebe |
| --- | --- | --- |
| `person:<id>` | Todo socket da Pessoa, na conexão | Os eventos guardados por Pessoa: na F03, `message.created` |
| `session:<id>` | Todo socket da Sessão, na conexão | Nada; serve para desconectar os sockets ao sair |
| `conversation:<id>` | O socket da aba que abriu a Conversa, depois da conferência de participação | O "digitando" |

### Sessão no WebSocket (API do chat)

As regras estão no LLD, "Sessão e login", "WebSocket". A implementação:

- **Handshake:** um middleware do servidor lê o cookie de `socket.handshake.headers.cookie` e chama
  o mesmo `SessionsService.authenticate` do guard REST. Sem Sessão, recusa com o erro
  `unauthenticated` (`connect_error` no cliente, com a mensagem igual ao `code`).
- **Sair:** `DELETE /v1/sessions/current`, depois de apagar a Sessão, desconecta os sockets da sala
  `session:<id>`, porque o gateway roda no mesmo processo.
- **Revogação e vencimento:** o comando de contas roda noutro processo e não alcança os sockets.
  Cada socket reconfere a Sessão a cada `intervalo de reconferência da Sessão no WebSocket` pelo
  mesmo `authenticate`; se ela não vale mais, a API emite `session.ended` e desconecta. Esse é
  o teto da história 6 do PRD.
- **Renovação:** a reconferência renova a Sessão como o REST, no máximo uma vez por `intervalo de
  renovação da Sessão` (LLD, "Sessão e login"). Uma aba aberta conta como uso, e quem deixa o chat
  aberto não precisa entrar de novo.
- No cliente, `connect_error` com `unauthenticated`, `session.ended` ou desconexão pelo servidor
  levam a `GET /api/session/expired` com o `?para=` da página atual, como os 401 do REST (LLD,
  "Cliente", "Sessão no cliente"). Depois de um `connect_error`, o cliente do Socket.IO não tenta
  de novo sozinho; outro erro de handshake volta a chamar `connect()` com o mesmo intervalo da
  reconexão.

### Eventos por Pessoa e reconexão (API do chat e Redis)

O Redis entra na F03, com o primeiro uso dele ([ADR 0007](../../adr/0007-redis-gerenciado.md); LLD,
"Integrações externas", "Eventos por pessoa").

- **Guardar:** um stream por Pessoa, `events:person:<id>`. Cada evento entra por `XADD` com o corte
  `MINID ~` de agora menos a `retenção dos eventos de reconexão`. O id do stream é o id do evento,
  crescente por Pessoa.
- **Época:** a chave `events:epoch` guarda um valor aleatório, criado com `SET NX` quando falta. O
  cursor que o cliente recebe é `<época>:<id do stream>`. Se o Redis perdeu os dados, a época muda e
  todo cursor antigo vira "perdido", em vez de uma reconexão que não reenvia nada e esconde a perda.
- **Ler desde:** o cursor é "perdido" quando a época difere, ou quando há eventos mais novos que o
  cursor (o `last-generated-id` do stream é maior que ele) e o primeiro evento que sobrou no stream
  é posterior ao cursor, ou não sobrou nenhum: algum evento depois do cursor pode ter sido cortado.
  Quando o corte apagou só o próprio evento do cursor, a regra recarrega sem precisar, mas nunca
  esconde uma perda. Fora disso, a API reenvia os eventos depois do cursor, por `XRANGE`. Um stream
  que não existe é vazio, sem nada apagado. O `max-deleted-entry-id` do `XINFO STREAM` não serve:
  ele só acompanha o `XDEL`, e não o corte (descoberto na F03-T07).
- **Queda mais longa que a retenção:** sem eventos novos para a Pessoa, o corte não roda e nada se
  perde; a reconexão reenvia o que houver, sem recarregar. O critério do PRD (história 5) vale como
  garantia: até 5 min, nunca recarrega.
- **Conexão, sempre na mesma ordem:** o socket entra nas salas `person:` e `session:`; a API lê os
  eventos depois do cursor, se o cliente mandou um válido, e os emite; por fim emite `sync`, com o
  cursor atual e `reset`. `reset` é verdadeiro na primeira conexão da aba, sem cursor, e com o
  cursor "perdido". O cursor atual de um stream vazio é o `last-generated-id` dele, ou `0-0`.
- **Publicação:** direta, depois do commit, como prevê o HLD 6.2 com uma instância só. Isso fecha a
  questão do LLD "Publicação do evento depois do commit". O service que orquestra o envio chama a
  gravação, que é a transação, e só depois publica, e só quando a Mensagem foi gravada agora: o
  reenvio do mesmo `client_id` não gera evento (LLD, "Concorrência e idempotência"). A publicação lê
  os Membros da Conversa, faz um `XADD` por Membro num pipeline e emite para cada sala `person:`, com
  o id do evento daquela Pessoa.
- **Redis fora ou travado:** a Mensagem já está gravada, então o envio responde sucesso; cada operação
  no Redis tem um prazo de 2 s, e a publicação não prende a resposta do envio. A publicação que não
  grava emite sem id de evento, registra `error` no log e marca, na memória do processo, as Pessoas
  que perderam o evento: a reconexão seguinte de cada uma responde `reset`. A reconexão sem Redis
  também responde `reset`.
- **Perda aceita:** se o processo cai entre o commit e a publicação, o evento não existe. Quem estava
  conectado vê a Mensagem só ao abrir a Conversa de novo.

### Eventos (`packages/chat-events`)

O pacote nasce na F03, como o LLD planeja: só tipos TypeScript, sem código de execução, ligado ao
`web` e à `chat-api` por `file:../../packages/chat-events` ([ADR 0017](../../adr/0017-projetos-pnpm-independentes.md)).
Campos em `snake_case`, como no REST.

| Evento | Direção | Carga |
| --- | --- | --- |
| `message.created` | API → aba | `event_id` (cursor, ausente se o Redis falhou) e `message`, no formato da Mensagem do REST (spec da F02, "Rotas") |
| `sync` | API → aba | `cursor` e `reset` |
| `session.ended` | API → aba | — |
| `conversation.open` | aba → API | `conversation_id`; com confirmação (`ack`) `ok` ou `conversation_not_found` |
| `conversation.close` | aba → API | `conversation_id` |
| `typing.start` | aba → API → abas | Da aba: `conversation_id`. Para as outras: `conversation_id` e `person` (`id`, `name`) |
| `typing.stop` | aba → API → abas | Igual ao `typing.start` |

O cursor vai no `auth` do handshake (`{ cursor }`). O snapshot OpenAPI não cobre o WebSocket; o
pacote é o contrato.

### "Digitando" (API do chat e web)

As regras estão no LLD, "Estados e regras", "Digitando". A implementação:

- **Abrir uma Conversa:** a aba emite `conversation.open`; a API confere a participação pela
  operação "Conversa da qual a Pessoa é Membro" (LLD, "Segurança"), como o REST, e põe o socket na
  sala `conversation:<id>`. A aba fica em uma sala de Conversa por vez e emite `conversation.close`
  ao trocar. Depois de uma reconexão, a aba abre a Conversa de novo.
- **Repasse:** a API só repassa `typing.start` e `typing.stop` de um socket que está na sala da
  Conversa, sem consultar o banco a cada aviso, para a sala menos as abas da própria Pessoa
  (`to(conversation:<id>).except(person:<id>)`). Nada vai para o Redis nem é reenviado na
  reconexão. Isso muda o HLD 6.2, que punha o "digitando" no mesmo caminho dos eventos guardados.
- **Quem digita:** a caixa de mensagem emite `typing.start` quando o texto muda e não está vazio, no
  máximo a cada `intervalo do aviso de digitando`. Emite `typing.stop` ao enviar, ao apagar
  todo o texto e ao trocar de Conversa.
- **Quem vê:** cada `typing.start` (re)arma um prazo de `expiração do digitando` para aquela
  Pessoa; `typing.stop` ou o prazo vencido a tiram. A aba fechada e a queda de quem digitava se
  resolvem pelo prazo, sem evento no `disconnect`. Na queda da própria aba, a lista de quem digita
  se esvazia.
- **Texto:** função pura do web — "Fulano está digitando…", "Fulano e Beltrana estão digitando…",
  "Várias pessoas estão digitando…" (três ou mais) —, em ordem de chegada.

### Cliente (web)

**Endereço:** a variável `CHAT_API_PUBLIC_URL` da web, lida no servidor e passada pelo layout das
telas logadas ao componente cliente, sem `NEXT_PUBLIC_`, para a mesma imagem servir a todos os
ambientes. Localmente, `http://localhost:3001`.

**Conexão por aba:** um provedor cliente no layout das telas logadas abre um socket só por aba e o
mantém entre as trocas de Conversa. Ele guarda:

- o estado da conexão (conectando, conectada, desconectada) e o cursor, em memória, por aba;
- até a chegada do `sync`, os eventos recebidos, que então são aplicados em ordem de id de evento e
  sem repetir um id (a sala `person:` já está ativa enquanto a API lê os reenviados);
- por Conversa, as últimas 100 Mensagens recebidas desde a conexão, para a Conversa que monta
  depois juntar as que chegaram enquanto o Server Component lia o histórico.

O provedor escuta o `offline` do navegador e desconecta na hora, e o `online` para conectar de novo:
o próprio cliente do Socket.IO ignora o `offline` quando o host é `localhost`. A reconexão segue o
padrão do cliente (de 1 s a 5 s, com aleatoriedade), sem limite de tentativas.

**Mensagens no histórico:** o evento entra no cache do `useSWRInfinite` da Conversa (spec da F02,
"Leituras") por uma função pura de junção:

- a lista fica sempre em ordem de id (UUID v7), a ordem da gravação, igual à do histórico;
- um id que já está no cache é ignorado;
- a Mensagem da própria Pessoa que chega pelo evento tira da lista de pendentes a de mesmo
  `client_id`, e a resposta do Server Action que chega depois não duplica;
- as pendentes ("enviando" e "falhou") continuam no fim, como na F02.

Ao montar, a Conversa junta as Mensagens guardadas pelo provedor com id maior que a mais nova da
primeira página. Com `sync` de `reset`, a Conversa aberta busca a página mais recente de novo pela
rota do BFF e substitui o cache por ela, como ao abri-la (PRD, história 5), mantendo as pendentes e
o texto da caixa de mensagem. A primeira conexão também é `reset`: assim nada se perde entre a
leitura do histórico no servidor e a entrada na sala.

**Iniciais:** o evento chega direto da API, sem passar pelo service do BFF que calculava as iniciais
(spec da F02, "Endereços e dados"). O cálculo vira uma função pura do web, usada pelo service e pelo
cliente.

**Telas**, que reproduzem os frames do Figma (arquivo `slack`, página Telas):

- **Rolagem e pílula** ("Conversa / Lista / Novas mensagens abaixo", 21:9308, com a NewMessagesPill
  21:9309): a lista está "no fim" quando a distância até o fim é de até a `distância do fim da
  lista`. No fim, a Mensagem
  que chega rola a lista até ela. Fora dele, a lista não se move e aparece a pílula "Novas
  mensagens", um botão que rola até o fim; ela some ao chegar ao fim por qualquer caminho. A
  Mensagem da própria Pessoa sempre rola até o fim, como na F02. Isso substitui o efeito da F02 que
  rolava até o fim a cada Mensagem nova.
- **"Digitando"** ("Conversa / Lista / Digitando", 21:8551): uma linha reservada acima da caixa de
  mensagem, já prevista no `message-history` da F02, que não muda de altura com ou sem texto. Ela
  não é região `aria-live`, para não anunciar cada aviso ao leitor de tela.
- **Faixa de conexão** (ConnectionBanner, "Casca / Banner de reconexão", 25:31291): no topo da
  Casca, com "Sem conexão em tempo real. Reconectando…", depois do `atraso da faixa de conexão`
  desconectada, e também quando a primeira conexão não acontece nesse prazo. Some ao conectar. É `role="status"` e não recebe o foco.
- Nada do que chega muda o foco nem o texto da caixa de mensagem (PRD, "Todas as histórias").

### Configuração e ambiente

- **API do chat:** `WEB_ORIGIN` (já planejada no LLD) e `REDIS_URL`. Nos testes, o Redis usa outro
  banco lógico, por `TEST_REDIS_URL`, para não misturar com o desenvolvimento.
- **Web:** `CHAT_API_PUBLIC_URL`.
- **Compose:** o serviço `redis` (`redis:8`), com healthcheck e volume, de que a `chat-api` passa a
  depender. A tabela de serviços do `AGENTS.md` da raiz e do LLD, seção "Ambiente de
  desenvolvimento", ganham a linha.
- **Valores:** os citados entre crases nesta spec, todos constantes, no LLD, "Valores e
  configuração".
- **Biblioteca do Redis:** LLD, "Estrutura do código".

## Decisões de teste

**O que faz um bom teste aqui:** o teste prova o que chega a cada socket e o que aparece na tela, e
não a forma interna do gateway. A forma de cada teste da API está em
`.claude/rules/nest-api-testing.md`.

**API do chat, testes de ponta a ponta com o servidor real**, ouvindo em `127.0.0.1` numa porta
livre, com `socket.io-client`, o banco de testes e o Redis de testes:

- handshake sem cookie, com Sessão vencida e de outra origem: recusado com `unauthenticated` (a
  origem, pelo CORS);
- `message.created` chega a todos os sockets dos Membros, inclusive a outra aba do autor, e não
  chega a quem não é Membro (participação apagada no Arrange); o reenvio do mesmo `client_id` não
  gera outro evento;
- reconexão com cursor reenvia, em ordem, só os eventos posteriores; sem cursor, `sync` com
  `reset`; cursor de outra época e cursor anterior ao corte: `reset`;
- `conversation.open` de quem não é Membro: `conversation_not_found`, e o socket não recebe o
  "digitando" daquela Conversa; `typing.start` chega aos outros da sala e não às abas da própria
  Pessoa;
- sair desconecta os sockets da Sessão e só os dela; a reconferência periódica desconecta com
  `session.ended` a Sessão revogada (intervalo encurtado no módulo de teste);
- Redis fora: o envio responde 201 e o evento sai sem `event_id`.

**Web, Vitest para as funções puras:** junção de Mensagens no cache (ordem, id repetido, pendente
pelo `client_id`), texto do "digitando", iniciais, e aplicação dos eventos guardados até o `sync`.

**Web, testes de ponta a ponta com o Playwright**, escritos pelo fluxo da skill `playwright-cli`,
com o plano de testes da F03 junto dos testes. Duas Pessoas em dois contextos do navegador, no mesmo
Canal:

- a Mensagem de uma aparece para a outra sem recarregar; a Mensagem enviada noutra aba da mesma
  Pessoa aparece nesta, sem duplicar;
- lendo mais acima, a lista não se move e aparece a pílula; a pílula pelo teclado leva ao fim;
- o "digitando" aparece com o nome, some ao enviar e some depois de 5 s sem digitar; nunca mostra a
  própria Pessoa;
- queda curta: `context.setOffline(true)` depois de a página abrir (o evento `offline` derruba o
  socket), a faixa aparece depois de 3 s, a outra Pessoa envia, `setOffline(false)`, a faixa some e
  a Mensagem aparece uma vez, sem recarregar a página;
- queda com cursor perdido: com a página offline, o teste apaga a época no Redis; ao voltar, a
  Conversa recarrega as mais recentes e mantém o texto da caixa de mensagem;
- sair noutra aba leva esta a "Entrar";
- a checagem de acessibilidade com `@axe-core/playwright` com a faixa, a pílula e o "digitando" na
  tela, sem violações.

A fixture que apaga a época conecta no Redis de desenvolvimento, como as fixtures da F02 conectam no
banco `chat`; o serviço `e2e` ganha `REDIS_URL`.

**Medição, registrada na pasta da tarefa do envio em tempo real** (`medicao-p95.md`): 50 sockets de
Pessoas diferentes num Canal, direto na API, e 200 Mensagens enviadas por REST. Registra o p95 do
tempo entre a resposta do envio (a gravação) e a chegada do `message.created` em cada socket, e o
do "digitando". O critério é o do PRD, histórias 1 e 3: até 1 s no p95. A carga de 50 é a referência
desta medição, enquanto as hipóteses de dimensionamento do HLD seguem "A definir".

**Roteiro manual, feito por uma pessoa e registrado na mesma pasta:** a nota 100 de Acessibilidade
do Lighthouse na Conversa com a faixa e a pílula, e uma queda de verdade (Wi-Fi desligado e
computador suspenso por 1 min), conferindo a faixa e a recuperação.

**Exemplos anteriores:** os testes da F01 e da F02, nas mesmas pastas e com as mesmas bases.

## Fora de escopo

- Tudo o que o PRD lista em "O que não é objetivo".
- Eventos de edição, exclusão, contadores e notificações: o caminho é o mesmo, e cada um entra com a
  funcionalidade dele (F06, F07, F08).
- A entrega pessoa a pessoa de Mensagens de dados de negócio ([ADR 0020](../../adr/0020-dados-de-negocio-pessoa-a-pessoa.md)):
  a publicação por sala `person:` já a comporta, e ela entra com a F13.
- Long-polling e mais de uma instância da API do chat.
- Uma tabela de saída para o evento sobreviver à queda do processo entre o commit e a publicação.

## Observações

- A F03 fecha questões em aberto do LLD: a publicação do evento depois do commit (direta), a lista
  de eventos do WebSocket (o pacote `chat-events`) e o "digitando" das subseções de "Estados e
  regras". O registro está no LLD, nas seções correspondentes, e o critério do tempo real e o
  caminho do "digitando" no HLD, seções 3 e 6.2.
- O glossário não muda.
- Os nós do Figma citados vieram do levantamento feito para esta spec e podem mudar de id se os
  frames forem recriados. Nesse caso, valem os nomes.
