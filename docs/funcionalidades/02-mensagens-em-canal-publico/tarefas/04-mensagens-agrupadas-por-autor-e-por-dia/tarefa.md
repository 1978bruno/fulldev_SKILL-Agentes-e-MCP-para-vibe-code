# 04: Mensagens agrupadas por autor e por dia

**Status:** concluída

**O que construir:** a Pessoa lê o Canal como uma conversa:
- as Mensagens seguidas do mesmo autor aparecem juntas, sem repetir nome e avatar;
- um divisor separa os dias;
- a hora sai no fuso do navegador;
- os endereços web viram links, e o resto aparece exatamente como foi escrito.

Referências:
- spec da F02, "BFF e telas" ("Funções puras do histórico" e "Lista de Mensagens");
- LLD, "Cliente" ("Cookies do cliente", fuso) e "Valores e configuração" ("Intervalo da forma
  compacta" e "Fuso padrão");
- PRD, história 3.

**Decisões consumidas de outras tarefas:**
- Vitest no web: 01.
- Lista cronológica plana para renderizar: 02.

**Bloqueada por:** 02 (Abrir um Canal criado por comando e enviar uma Mensagem)

- [x] **CA1** · Uma função pura decide a forma compacta pela regra da spec (mesmo autor, mesmo dia
  no fuso e dentro do `intervalo da forma compacta`), e a lista usa o MessageItem compacto
  (22:7404). A tarefa 05 passa as Mensagens pendentes pela mesma função.
- [x] **CA2** · Uma função pura dá o rótulo do DayDivider: "Hoje", "Ontem", a data sem o ano no ano
  corrente e com o ano nos anteriores. Outra formata a hora em 24 h. As duas recebem o fuso como
  parâmetro.
- [x] **CA3** · O cookie de fuso funciona como o LLD ("Cookies do cliente"): o servidor formata com
  ele e, sem ele, usa o `fuso padrão`; se o fuso gravado difere do navegador, o cliente o regrava
  e faz `router.refresh()`. As horas e os divisores renderizados no servidor e no cliente são
  iguais, sem aviso de hidratação.
- [x] **CA4** · Uma função pura separa os links `http://` e `https://` do texto pela regra da spec,
  inclusive a pontuação final e o `)` sem par. O link abre em outra aba, com
  `rel="noopener noreferrer"`. O resto do texto sai como texto, com as quebras de linha, e nunca
  como HTML.
- [x] **CA5** · O Vitest prova as funções de CA1, CA2 e CA4, inclusive a virada de dia no fuso, a
  virada de ano e as bordas exatas do intervalo.
- [x] **CA6** · O Playwright prova a forma compacta e o divisor com Mensagens em datas conhecidas,
  o link abrindo em outra aba e um texto com marcação HTML aparecendo como texto.
- [x] **CA7** · A validação visual de "Mensagem / Completa", "Mensagem / Compacta" e do divisor,
  nos dois temas, e o roteiro manual com a nota 100 de Acessibilidade do Lighthouse na Conversa
  estão registrados na pasta desta tarefa.
