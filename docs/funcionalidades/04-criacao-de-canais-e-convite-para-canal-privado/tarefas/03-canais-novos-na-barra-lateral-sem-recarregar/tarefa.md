# 03: Canais novos na barra lateral sem recarregar

**Status:** em andamento

**O que construir:** quando alguém cria um Canal público, ele aparece na barra lateral de todas as
Pessoas em até 1 s, sem recarregar a página, em todas as abas, na ordem alfabética e sem abrir
sozinho nem mudar o foco. Depois de uma queda, o que chegou no meio aparece na reconexão, e a perda
dos eventos recarrega a lista. Referências:
- spec da F04, "Tempo real", "BFF" ("Rotas de leitura") e "Cliente" ("Lista de Conversas no
  cliente");
- spec da F03, "Eventos por Pessoa e reconexão" e "Cliente";
- LLD, "Transações" e "Cliente" ("Leituras e tempo real");
- PRD, história 4.

**Decisões consumidas de outras tarefas:**
- `member_count` na Conversa e ordem por `Intl.Collator('pt-BR')`, nas duas cópias: 01.

**Bloqueada por:** 01 (Criar um Canal público pela barra lateral)

- [ ] **CA1** · O evento `conversation.member_added` entra no pacote `chat-events`, com `event_id`,
  `conversation` (no formato do REST, com `member_count`) e `person_ids`.
- [ ] **CA2** · O service que orquestra a criação publica o evento depois do commit para todos os
  Membros que a Conversa tem depois da gravação, com `person_ids` das Pessoas que entraram agora,
  pelo caminho do `message.created`: guardado no stream de cada Pessoa e emitido para a sala
  `person:`. O reenvio idempotente não publica. Redis fora ou travado segue a F03. A regra vale para
  qualquer tipo de Canal: o privado, ao existir, publica só para quem o criou.
- [ ] **CA3** · A lista de Conversas da barra lateral passa a um `useSWR` de chave fixa, com a lista
  do Server Component como `fallbackData`; o esqueleto e o erro continuam no servidor.
- [ ] **CA4** · Uma função pura aplica o evento à lista: com a Pessoa da aba em `person_ids`, insere
  a Conversa na ordem da 01 e ignora um id que já está lá; sem ela, atualiza o `member_count`. O
  evento passa pelo provedor da F03, com a aplicação em ordem até o `sync`.
- [ ] **CA5** · `GET /api/conversations` lê a lista, e o `sync` de `reset` a busca de novo, junto com
  o histórico da Conversa aberta.
- [ ] **CA6** · Os testes de ponta a ponta da API com `socket.io-client` provam que o evento do Canal
  público chega a todas as Pessoas conectadas, que o reenvio idempotente não gera outro, e que o
  evento volta na reconexão com cursor. O Vitest prova a função de aplicação.
- [ ] **CA7** · O Playwright prova, com duas Pessoas, o Canal criado por uma aparecendo na barra
  lateral da outra sem recarregar, sem tirar o foco da caixa de mensagem.
- [ ] **CA8** · A medição do p95 entre a resposta da criação e a chegada do evento, com 50 sockets e
  50 Canais públicos, está em `medicao-p95.md` nesta pasta, com o critério do PRD (até 1 s).
