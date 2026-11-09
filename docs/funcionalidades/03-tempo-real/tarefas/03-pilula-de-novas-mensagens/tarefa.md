# 03: Pílula de novas mensagens

**Status:** concluída

**O que construir:** a Pessoa que está lendo Mensagens antigas não é tirada do lugar quando chega
uma nova: aparece a pílula "Novas mensagens", que leva ao fim. No fim da lista, a Mensagem nova rola
a lista até ela. Referências:
- spec da F03, "Cliente" ("Telas", "Rolagem e pílula");
- LLD, "Valores e configuração" ("Distância do fim da lista");
- PRD, história 2.

**Decisões consumidas de outras tarefas:**
- Junção das Mensagens no cache: 02.

**Bloqueada por:** 02 (Mensagens dos outros chegam sem recarregar)

- [x] **CA1** · A lista está "no fim" até a `distância do fim da lista`. No fim, a Mensagem que chega
  rola até ela. Fora dele, a lista não se move. Isso substitui o efeito da F02 que rolava até o fim a
  cada Mensagem nova.
- [x] **CA2** · Fora do fim, a chegada de uma Mensagem mostra a pílula "Novas mensagens" (21:9308,
  21:9309), um botão que rola até o fim. Ela some ao chegar ao fim por qualquer caminho.
- [x] **CA3** · A Mensagem da própria Pessoa sempre rola até o fim. A carga de anteriores continua
  devolvendo a rolagem à mesma Mensagem.
- [x] **CA4** · O Playwright prova a lista parada com a pílula, a pílula pelo teclado levando ao fim,
  e a rolagem automática no fim. A checagem do axe com a pílula na tela não tem violações.
- [x] **CA5** · A validação visual da pílula, nos dois temas, está registrada nesta pasta.
