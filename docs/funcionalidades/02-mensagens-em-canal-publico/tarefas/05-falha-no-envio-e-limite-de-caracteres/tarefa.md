# 05: Falha no envio e limite de caracteres

**Status:** a fazer

**O que construir:** a Pessoa vê a Mensagem "enviando" logo que envia. Se o envio falha, ela tenta
de novo sem a Mensagem aparecer duas vezes, ou a descarta. A caixa não deixa enviar uma Mensagem
vazia nem acima do limite, e mostra quantos caracteres passaram. Referências:
- spec da F02, "Mensagens" (texto e envio repetido) e "BFF e telas" ("Envio" e "Caixa de
  mensagem");
- LLD, "Concorrência e idempotência" ("Envio de mensagem") e "Valores e configuração" ("Tamanho
  máximo da Mensagem");
- PRD, histórias 5 e 6.

**Decisões consumidas de outras tarefas:**
- Vitest no web: 01.
- Unicidade em (`author_id`, `client_id`) e limite do texto no banco: 02.
- Cache só com as Mensagens gravadas, retorno do service HTTP do web e Server Action de envio: 02.
- Função da forma compacta, pela qual passam as Mensagens pendentes: 04.

**Bloqueada por:** 04 (Mensagens agrupadas por autor e por dia)

- [ ] **CA1** · O envio na API tolera a repetição: o mesmo `client_id` do mesmo autor devolve a
  Mensagem já gravada, com o mesmo 201, sem gravar outra linha, inclusive em dois envios
  simultâneos.
- [ ] **CA2** · O texto é contado em pontos de código Unicode, igual na API, no banco e numa função
  pura do web. Exatamente o `tamanho máximo da Mensagem` com emojis é aceito, e um a mais é
  recusado com `validation_failed`. Vazio e só espaços também são recusados.
- [ ] **CA3** · A caixa mostra "N caracteres acima do limite" (23:13781) e desabilita o botão
  acima do limite e com o texto vazio. Enter não envia nesses casos, nem durante a composição de
  IME.
- [ ] **CA4** · As Mensagens ainda não gravadas ficam fora do cache do SWR, sempre no fim da lista,
  e passam pela função da forma compacta. A "enviando" (22:11072) vira a gravada sem mudar de
  lugar.
- [ ] **CA5** · O cliente envia uma Mensagem por vez, numa fila, e as Mensagens enviadas em
  sequência aparecem na ordem do envio.
- [ ] **CA6** · Uma falha da rede ou do servidor deixa a Mensagem com "Não foi possível enviar."
  (22:12030). "Tentar de novo" reenvia com o mesmo `client_id`, e "Descartar" a tira da lista.
  Recarregar a página descarta as Mensagens com falha.
- [ ] **CA7** · Os testes de ponta a ponta da API provam CA1 e CA2. O Vitest prova a contagem de
  caracteres.
- [ ] **CA8** · O Playwright prova o botão desabilitado com texto vazio, o contador acima do limite
  e a falha simulada por `page.route`, com "Tentar de novo" gravando uma Mensagem só e "Descartar"
  tirando a Mensagem da lista.
- [ ] **CA9** · A validação visual de "Enviando", "Falha no envio" e "Composer / Acima do limite",
  nos dois temas, está registrada na pasta desta tarefa.
