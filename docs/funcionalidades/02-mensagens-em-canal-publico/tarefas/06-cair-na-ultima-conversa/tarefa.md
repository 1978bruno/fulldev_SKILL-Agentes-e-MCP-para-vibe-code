# 06: Cair na última Conversa ao entrar

**Status:** a fazer

**O que construir:** ao chegar na Home, a Pessoa cai no último Canal que abriu naquele navegador.
Na primeira visita, ou se aquele Canal não está mais na lista dela, cai no primeiro da lista, e
sem Canais vê "Nenhuma conversa ainda". Enquanto a Home decide, aparece o carregamento; se a lista
não carrega, aparece o erro. Referências:
- spec da F02, "BFF e telas" ("Cookies do navegador" e "Home");
- LLD, "Cliente" (tabela de telas e "Cookies do cliente");
- PRD, história 2.

**Decisões consumidas de outras tarefas:**
- Retorno do service HTTP do web e lista de Conversas: 02.

**Bloqueada por:** 02 (Abrir um Canal criado por comando e enviar uma Mensagem)

- [ ] **CA1** · Ao abrir uma Conversa, o cliente grava o cookie da última Conversa com os atributos
  do LLD ("Cookies do cliente").
- [ ] **CA2** · A Home redireciona para a Conversa do cookie quando ela está na lista da Pessoa;
  senão, para a primeira da lista; sem nenhuma, mostra "Home / Vazio" (19:1645).
- [ ] **CA3** · Enquanto decide, a Home mostra "Home / Carregando" (19:1533). Se a lista falha, ela
  mostra "Conversa / Erro ao carregar a lista" (26:46375), com "Tentar de novo".
- [ ] **CA4** · O Playwright prova a volta à última Conversa, a primeira da lista na primeira
  visita e com um cookie de Conversa que não está na lista, e a Home vazia de uma Pessoa sem
  Canais. A checagem com `@axe-core/playwright` na Home vazia passa sem violações.
- [ ] **CA5** · A verificação do agente com o `playwright-cli`, com a API do chat parada, confere o
  erro da Home e o "Tentar de novo" depois de subir a API, e fica registrada na pasta desta
  tarefa, com a validação visual de "Home / Carregando" e do erro nos dois temas.
