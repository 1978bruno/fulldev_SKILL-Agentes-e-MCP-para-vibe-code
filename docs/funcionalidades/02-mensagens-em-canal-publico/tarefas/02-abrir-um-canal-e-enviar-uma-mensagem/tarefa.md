# 02: Abrir um Canal criado por comando e enviar uma Mensagem

**Status:** em andamento

**O que construir:** a fatia tracer bullet da F02, em quatro passos:
1. Quem opera a instalação cria um Canal público por comando, e todas as Pessoas viram Membros.
2. A Pessoa entra, vê o Canal na barra lateral e o abre.
3. Ela lê as Mensagens mais recentes, com autor, hora e texto.
4. Ela envia uma Mensagem, que aparece no fim da lista e continua lá depois de recarregar.

Um endereço de Conversa que não existe mostra "Conversa não encontrada". Esta tarefa toma as
decisões que as próximas consomem: a forma das tabelas, a trava de participação, o cache do
histórico no cliente e o retorno do service HTTP do web. Referências:
- spec da F02, "Conversas e participação", "Mensagens", "Rotas", "Módulos", "Comando de canais" e
  "BFF e telas";
- LLD, "Segurança" ("Participação numa Conversa"), "Concorrência e idempotência", "Interfaces" e
  "Cliente";
- PRD, histórias 1, 3, 5 e 7.

**Decisões consumidas de outras tarefas:**
- Transação entre módulos pelo CLS: 01.

**Bloqueada por:** 01 (Bases de transação e de testes de unidade)

- [ ] **CA1** · As tabelas `conversations`, `conversation_members` e `messages` existem por
  migração, com as colunas, as unicidades, os índices e os `CHECK` da spec, inclusive a unicidade
  em (`author_id`, `client_id`) e o limite do texto.
- [ ] **CA2** · O comando de canais tem a operação `create`, com o nome e o Tópico opcional.
  - Valida o nome pela regra da spec, numa função pura com testes de unidade, e recusa nome
    repetido ou inválido, com mensagem.
  - Grava o Canal e a participação de todas as Pessoas numa transação que começa tomando a trava
    de participação da spec. A chave da trava fica num lugar só, para o `create` de contas (tarefa
    09) usar a mesma.
  - O comando entra no `AGENTS.md` da API.
- [ ] **CA3** · O service de Conversas tem a operação "Conversa da qual a Pessoa é Membro", que
  devolve a Conversa ou lança `conversation_not_found`. O código entra no catálogo e nos mapas do
  filter. As rotas de Conversa e de Mensagens passam por ela.
- [ ] **CA4** · `GET /v1/conversations` devolve só as Conversas de que a Pessoa é Membro, em ordem
  alfabética, e `GET /v1/conversations/:id` devolve a Conversa. Id inexistente, malformado ou sem
  participação recebem o mesmo 404.
- [ ] **CA5** · `GET /v1/conversations/:id/messages`, sem `before`, devolve a página mais recente
  em ordem cronológica, com `has_more`. `POST /v1/conversations/:id/messages` grava a Mensagem com
  o autor da Sessão, as pontas do texto removidas e o limite de caracteres da spec, e responde 201.
- [ ] **CA6** · O service HTTP do web tem as quatro rotas, com o retorno em união discriminada e o
  autor de cada Mensagem com as iniciais calculadas no servidor. A leitura da Pessoa da Sessão é
  memorizada por requisição e reaproveitada pela página.
- [ ] **CA7** · A barra lateral mostra a seção "Canais" (25:20064), com os Canais em ordem
  alfabética, e abre um Canal pelo clique e pelo teclado. Ficam de fora os itens das
  funcionalidades futuras, como lista a spec.
- [ ] **CA8** · `/conversas/<id>` mostra o ConversationHeader com `#`, nome e Tópico e a página
  mais recente em MessageItem completo (22:6386), com a última Mensagem visível acima da caixa e o
  foco na caixa. A hora sai no fuso padrão do LLD até a tarefa 04. Endereço desconhecido mostra a
  tela 21:1987 (o status HTTP fica 200, como a spec explica em "Conversa").
- [ ] **CA9** · No cliente, o histórico fica num `useSWRInfinite`, com a primeira página do Server
  Component como `fallbackData`. O cache guarda só as Mensagens gravadas, e a renderização recebe
  uma lista cronológica plana. As tarefas 03, 04 e 05 consomem essa forma.
- [ ] **CA10** · A caixa de mensagem (23:12257, 23:13024) mostra "Mensagem para #nome"; Enter
  envia, Shift+Enter quebra a linha. O envio é um Server Action com o `client_id` gerado no
  cliente. A Mensagem gravada entra no cache, a caixa esvazia e a lista rola até o fim.
- [ ] **CA11** · A Home redireciona para o primeiro Canal da lista ou, sem Canais, mostra "Home /
  Vazio". Um 401 no Server Action leva a "Entrar" com o `?para=` da Conversa, e o endereço de um
  Canal aberto sem Sessão volta a ele depois de entrar. Voltar e avançar do navegador trocam de
  Canal.
- [ ] **CA12** · Os testes de ponta a ponta da API provam CA3 a CA5, inclusive a lista só com as
  próprias participações e o 401 sem Sessão, com a base da spec (`uniqueChannelName()` e os
  atalhos de Canal e Mensagens). O teste de integração do comando prova o CA2.
- [ ] **CA13** · O Playwright prova abrir um Canal pela barra lateral e pelo teclado, enviar e ver
  a Mensagem depois de recarregar, Enter e Shift+Enter, "Conversa não encontrada", o `?para=` e
  voltar e avançar.
  - As fixtures `channel` e de Mensagens estão como a spec descreve.
  - O plano de testes da F02 é criado pelo fluxo da skill `playwright-cli`.
  - A checagem com `@axe-core/playwright` na Conversa passa sem violações.
- [ ] **CA14** · A validação visual da Conversa (21:2843) e da barra lateral, em 1440 × 900 nos
  dois temas, está registrada na pasta desta tarefa.
