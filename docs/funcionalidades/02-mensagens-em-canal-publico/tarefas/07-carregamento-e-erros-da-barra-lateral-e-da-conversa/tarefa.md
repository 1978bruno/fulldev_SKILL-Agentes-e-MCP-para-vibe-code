# 07: Carregamento e erros da barra lateral e da Conversa

**Status:** a fazer

**O que construir:** a Pessoa sempre sabe o que está acontecendo:
- a barra lateral mostra o esqueleto enquanto carrega e um erro com "Tentar de novo" quando falha;
- a seção "Canais" recolhe e expande, e o Canal aberto fica destacado;
- a Conversa mostra o carregamento do histórico e um erro com "Tentar de novo" quando falha.

Referências:
- spec da F02, "BFF e telas" ("Barra lateral" e "Conversa");
- PRD, histórias 1 e 3.

**Decisões consumidas de outras tarefas:**
- Seção e linhas da barra lateral e retorno do service HTTP do web: 02.

**Bloqueada por:** 02 (Abrir um Canal criado por comando e enviar uma Mensagem)

- [ ] **CA1** · A barra lateral carrega num `Suspense` próprio, com o esqueleto (25:19071). Se a
  lista falha, ela mostra "Não foi possível carregar suas conversas." com "Tentar de novo"
  (25:19177), que refaz a renderização, sem derrubar o resto do shell.
- [ ] **CA2** · A seção "Canais" recolhe e expande pelo clique e pelo teclado (25:20813), com o
  estado exposto a leitores de tela.
- [ ] **CA3** · A linha da Conversa aberta fica ativa, num componente cliente pequeno que lê o
  segmento da rota, e muda ao trocar de Canal e ao voltar e avançar no navegador.
- [ ] **CA4** · A Conversa mostra "Histórico carregando" (21:1869) enquanto carrega. Se a Conversa
  ou a primeira página falham, ela mostra "Não foi possível carregar as mensagens desta conversa."
  com "Tentar de novo" (21:4642), e o cabeçalho mostra o nome quando a Conversa carregou.
- [ ] **CA5** · O Playwright prova a seção recolhida e expandida e a linha ativa.
- [ ] **CA6** · A verificação do agente com o `playwright-cli`, com a API do chat parada, confere
  os erros da barra lateral e da Conversa e o "Tentar de novo" depois de subir a API. Ela fica
  registrada na pasta desta tarefa, com a validação visual do esqueleto, do erro da barra lateral,
  da seção recolhida, do "Histórico carregando" e do "Erro ao carregar", nos dois temas.
