# 05: Lista de Membros e adicionar depois

**Status:** concluída

**O que construir:** o cabeçalho do Canal mostra quantos Membros ele tem; clicar abre "Membros de
#nome", com cada Membro em ordem alfabética e "(você)" ao lado da própria Pessoa. No Canal privado,
"Adicionar pessoas" abre o mesmo passo da criação, e a quantidade e a lista mudam sem recarregar
quando alguém é adicionado. Referências:
- spec da F04, "Rotas", "BFF" ("Rotas de leitura") e "Cliente" ("Cabeçalho do Canal" e "Lista de
  Membros");
- PRD, histórias 3 e 5.

**Decisões consumidas de outras tarefas:**
- `member_count` na Conversa e ordem por `Intl.Collator('pt-BR')`: 01.
- Lista de Conversas no `useSWR` e aplicação do evento: 03.
- Passo "Adicionar pessoas", busca e adição: 04.

**Bloqueada por:** 03 (Canais novos na barra lateral sem recarregar), 04 (Adicionar Pessoas ao
Canal privado na criação)

- [x] **CA1** · No Figma, "Conversa / Sobreposições / Membros do canal" ganha uma variante de Canal
  privado com o botão "Adicionar pessoas", e o passo "Adicionar pessoas" aberto pela lista de
  Membros ganha o frame dele, antes do código da tela.
- [x] **CA2** · `GET /v1/conversations/:id/members` devolve os Membros (`id`, `name`) na ordem da
  01, pela conferência de participação (404 para quem não é Membro), e o BFF ganha
  `GET /api/conversations/:id/members`.
- [x] **CA3** · O ConversationHeader mostra o botão com a quantidade de Membros, lida da lista de
  Conversas no cliente, e o botão abre a lista de Membros.
- [x] **CA4** · A lista de Membros é um Dialog com PersonRow, lida ao abrir e de novo a cada
  `conversation.member_added` daquela Conversa enquanto está aberta, com "(você)" ao lado da Pessoa
  da Sessão. No Canal privado, "Adicionar pessoas" abre o passo da 04; no público, ele não aparece.
- [x] **CA5** · Os testes de ponta a ponta da API provam a ordem dos Membros, o 404 para quem não é
  Membro de um Canal privado e o 401.
- [x] **CA6** · O Playwright prova, com duas Pessoas, a lista com "(você)", a adição pela lista de
  Membros, a quantidade mudando sem recarregar na aba da outra Pessoa, o botão ausente no Canal
  público e a checagem do axe na lista, sem violações.
- [x] **CA7** · A validação visual da lista de Membros e do cabeçalho, nos dois temas, contra os
  frames, fica nesta pasta.
- [x] **CA8** · O roteiro manual com a nota 100 de Acessibilidade do Lighthouse no diálogo "Criar
  canal", no passo "Adicionar pessoas" e na lista de Membros está em `roteiro-manual.md` nesta
  pasta.
