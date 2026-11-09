# 02: Canal privado visível só para quem o criou

**Status:** em andamento

**O que construir:** com "Tornar privado" ligado, a Pessoa cria um Canal privado, que abre só com
ela como Membro e aparece com o cadeado na barra lateral e no cabeçalho. Quem não é Membro não o vê
em lista nenhuma, e o endereço dele mostra "Conversa não encontrada". O passo de adicionar Pessoas
é da 04. Referências:
- spec da F04, "Conversas" e "Cliente" ("Telas": barra lateral e cabeçalho);
- LLD, "Segurança" ("Participação numa Conversa");
- PRD, histórias 2 e 6.

**Decisões consumidas de outras tarefas:**
- Contrato do `POST /v1/conversations`, criação sem duplicar e normalização do nome na web: 01.

**Bloqueada por:** 01 (Criar um Canal público pela barra lateral)

- [ ] **CA1** · No Figma, o cabeçalho de "Conversa / Estrutura / Canal privado" passa a mostrar o
  nome do Canal aberto (`diretoria`), antes do código da tela.
- [ ] **CA2** · O `CHECK` de `kind` aceita `private_channel`, e o nome é obrigatório nos dois tipos
  de Canal, numa migração. A conta nova continua entrando só nos Canais públicos.
- [ ] **CA3** · `POST /v1/conversations` com `private_channel` grava só a participação de quem
  criou, com a mesma trava, o mesmo reenvio idempotente e o nome único entre todos os Canais.
- [ ] **CA4** · O Switch "Tornar privado" do diálogo cria o Canal privado, que abre direto nesta
  tarefa.
- [ ] **CA5** · A SidebarRow e o ConversationHeader do Canal privado usam o ícone `Lock` no lugar do
  `Hash`, e a seção "Canais" mostra públicos e privados juntos, na ordem da 01.
- [ ] **CA6** · Os testes de ponta a ponta da API provam que o Canal privado tem só quem o criou;
  que o nome de um Canal privado de que a Pessoa não é Membro dá 409; que quem não é Membro recebe
  404 na Conversa, no histórico e no envio e não o vê na lista; e que a conta nova não entra nele.
- [ ] **CA7** · O Playwright prova a criação do Canal privado com o cadeado, e que outra Pessoa não
  o vê na barra lateral e vê "Conversa não encontrada" pelo endereço dele.
- [ ] **CA8** · A validação visual da barra lateral e do cabeçalho do Canal privado, nos dois temas,
  fica nesta pasta.
