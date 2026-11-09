# 04: Adicionar Pessoas ao Canal privado na criação

**Status:** em andamento

**O que construir:** depois de criar um Canal privado, a Pessoa passa ao passo "Adicionar pessoas",
busca Pessoas pelo nome, sem se preocupar com acentos, escolhe várias e confirma, ou pula. As
adicionadas viram Membros na hora, veem o Canal aparecer na barra lateral sem recarregar, com o
histórico inteiro, e passam a receber as Mensagens dele em tempo real. Referências:
- spec da F04, "Conversas" ("Adicionar ao Canal"), "Busca de Pessoas", "Rotas", "Módulos", "Tempo
  real", "BFF" e "Cliente" ("Depois de criar" e "Passo 'Adicionar pessoas'");
- LLD, "Concorrência e idempotência" ("Adicionar ao Canal privado") e "Valores e configuração";
- PRD, histórias 2, 3 e 6.

**Decisões consumidas de outras tarefas:**
- Ordem por `Intl.Collator('pt-BR')`: 01.
- Tipo `private_channel` e criação do Canal privado: 02.
- Evento `conversation.member_added`, destinatários e aplicação na lista do cliente: 03.

**Bloqueada por:** 02 (Canal privado visível só para quem o criou), 03 (Canais novos na barra
lateral sem recarregar)

- [ ] **CA1** · No Figma, os frames do passo "Adicionar pessoas" na criação (com busca, escolhidas,
  sem resultado e enviando) e da falha ao adicionar, no padrão de busca e PersonRow de "Diálogos /
  Nova conversa", antes do código da tela.
- [ ] **CA2** · `GET /v1/people` busca pelo nome com `unaccent`, criada numa migração, com `%`, `_`
  e `\` como literais; exige ser Membro de `not_member_of` (senão, 404) e deixa os Membros dela de
  fora; devolve até o `limite da busca de Pessoas`, na ordem da 01, e as primeiras com `q` vazio.
- [ ] **CA3** · `POST /v1/conversations/:id/members` passa pela conferência de participação; Canal
  público dá `members_not_editable` (409); `person_ids` vazio, repetido, acima das `Pessoas por
  adição ao Canal` ou com id que não é de Pessoa dá `validation_failed`. A gravação tolera quem já é
  Membro e responde `added_person_ids` e `member_count`.
- [ ] **CA4** · A adição publica `conversation.member_added` para os Membros antigos e os novos, com
  `person_ids` dos novos; sem Pessoa nova, não publica.
- [ ] **CA5** · O Server Action `addMembers` e a rota `GET /api/people` do BFF, com 401 levando a
  `GET /api/session/expired`.
- [ ] **CA6** · O passo "Adicionar pessoas" é um componente que a 05 reaproveita: busca depois da
  `espera da busca de Pessoas`, descarta a resposta de uma busca mais antiga, mostra as escolhidas
  acima dos resultados, cada uma com um botão para tirar, e confirma por `addMembers`; na falha,
  fica aberto com as escolhidas e o erro. Fechar por Esc, pelo X ou por "Pular" abre o Canal só com
  quem o criou.
- [ ] **CA7** · Os testes de ponta a ponta da API provam a busca (acentos, literais, `not_member_of`,
  limite, 404), a adição (Membros novos, quem já era fora de `added_person_ids`, 400, 404, 409), que
  o evento da criação de um Canal privado chega só às abas de quem o criou, que o da adição chega
  aos Membros antigos e novos e não a quem não é Membro, e que a Pessoa adicionada recebe o
  `message.created` e abre a Conversa no WebSocket.
- [ ] **CA8** · O Playwright prova, com duas Pessoas: uma cria o Canal privado e adiciona a outra
  pela busca, e o Canal aparece para a outra sem recarregar, com o cadeado e as Mensagens anteriores,
  e as novas chegam em tempo real; o "Pular" e o Esc; a falha ao adicionar pelo `page.route`, sem
  perder as escolhidas; tudo pelo teclado; e a checagem do axe no passo, sem violações.
- [ ] **CA9** · A validação visual do passo, nos dois temas, contra os frames, fica nesta pasta.
