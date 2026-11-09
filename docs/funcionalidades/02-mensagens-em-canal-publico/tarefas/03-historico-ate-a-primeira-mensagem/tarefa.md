# 03: Histórico até a primeira Mensagem

**Status:** concluída

**O que construir:** a Pessoa rola o Canal para cima e as Mensagens anteriores vão carregando,
sem a Mensagem que ela lia sair do lugar, até chegar ao começo do Canal. Pelo teclado, faz o mesmo
pelo link "Carregar mensagens anteriores". Referências:
- spec da F02, "Rotas" (paginação) e "BFF e telas" ("Leituras" e "Lista de Mensagens");
- LLD, "Interfaces" (paginação), "Cliente" ("Leituras e tempo real") e "Valores e configuração"
  ("Tamanho da página");
- PRD, história 4.

**Decisões consumidas de outras tarefas:**
- Forma das tabelas e índice da paginação: 02.
- Cache do histórico no `useSWRInfinite` e lista cronológica plana para renderizar: 02.
- Retorno do service HTTP do web e Mensagem com iniciais: 02.

**Bloqueada por:** 02 (Abrir um Canal criado por comando e enviar uma Mensagem)

- [x] **CA1** · `GET /v1/conversations/:id/messages` aceita `before` e `limit` como o LLD
  ("Interfaces"), devolve as Mensagens anteriores em ordem cronológica e `has_more`. `before`
  malformado e `limit` fora da faixa recebem `validation_failed`.
- [x] **CA2** · A rota do BFF `GET /api/conversations/:id/messages` repassa `before` à API pelo
  service HTTP e responde 401 sem Sessão, o que leva o cliente a "Entrar" com o `?para=` da
  Conversa.
- [x] **CA3** · Um sentinela no topo da lista carrega a página anterior ao chegar a 300 px da área
  visível, com o indicador 21:6830. Depois de acrescentar a página, a Mensagem que estava visível
  continua no mesmo lugar da tela, pela medida da altura antes e depois.
- [x] **CA4** · O link "Carregar mensagens anteriores" (21:6069) carrega a mesma página e é
  alcançável pelo teclado. A área de rolagem recebe foco e rola pelas setas e por Page Up e Page
  Down.
- [x] **CA5** · Se a carga das anteriores falha, as Mensagens já carregadas ficam, e o link volta a
  aparecer para tentar de novo.
- [x] **CA6** · Sem mais Mensagens, o topo mostra "Este é o começo do canal #nome" com o Tópico
  (ConversationIntro, 21:4808). Um Canal sem Mensagens mostra só isso.
- [x] **CA7** · Os testes de ponta a ponta da API provam CA1: as páginas encadeadas cobrem o
  histórico inteiro sem repetir nem pular Mensagens, além do `has_more` verdadeiro e falso e do
  padrão e do máximo do `tamanho da página`.
- [x] **CA8** · O Playwright prova abrir nas mais recentes, rolar até o topo carregando as
  anteriores sem mudar a Mensagem visível, o link pelo teclado e o começo do Canal, com um
  histórico montado pela fixture de Mensagens.
- [x] **CA9** · A `medicao-p95.md` desta pasta registra o p95 da primeira página e de uma página do
  meio, direto na API, e o tempo até as Mensagens aparecerem na tela, num Canal com 100 mil
  Mensagens, contra o critério do PRD (história 4). O Canal da medição é apagado depois.
- [x] **CA10** · A validação visual de "Carregando anteriores", "Carregar mensagens anteriores" e
  "Início do canal", nos dois temas, está registrada na pasta desta tarefa.
