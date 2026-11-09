# 08: Gaveta em telas estreitas

**Status:** concluída

**O que construir:** numa janela estreita, abaixo de 768 px de largura, o Rail e a barra lateral
viram uma gaveta, que a Pessoa abre por um botão no cabeçalho e que fecha ao escolher um Canal.
Antes do código, o Figma ganha o frame da gaveta. Referências:
- spec da F02, "BFF e telas" ("Gaveta abaixo de `md`" e "Mudança no Figma, antes do código da
  gaveta");
- `docs/design-system.md`, "Layout e responsividade", "Ícones" e "Do código para o Figma";
- PRD, critérios de "Todas as histórias".

**Decisões consumidas de outras tarefas:**
- Seção e linhas da barra lateral: 02.

**Bloqueada por:** 02 (Abrir um Canal criado por comando e enviar uma Mensagem)

- [x] **CA1** · No Figma, existe o frame "Casca / Gaveta / Aberta", em 767 de largura, montado
  com os componentes e as variables locais, com a gaveta aberta sobre a Conversa e o IconButton no
  cabeçalho. O ícone `icon/menu` existe na seção Ícones.
- [x] **CA2** · Abaixo de `md`, o Rail e a barra lateral saem do shell e entram numa gaveta (Dialog
  do Radix), aberta por um IconButton com rótulo no ConversationHeader e na Home. A gaveta fecha
  pelo Esc, pelo clique fora e ao escolher um Canal, e o foco volta ao botão.
- [x] **CA3** · Em `md` ou mais, o shell continua como antes, sem o botão.
- [x] **CA4** · O Playwright prova, em 767 de largura, abrir a gaveta, escolher um Canal e a gaveta
  fechar, e a checagem com `@axe-core/playwright` na gaveta aberta passa sem violações.
- [x] **CA5** · A situação da gaveta no `docs/design-system.md` ("Layout e responsividade") é
  atualizada, e a validação visual da gaveta em 767, nos dois temas, contra o frame novo, está
  registrada na pasta desta tarefa.
