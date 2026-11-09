# 02: Mensagens dos outros chegam sem recarregar

**Status:** a fazer

**O que construir:** com o Canal aberto, a Pessoa vê as Mensagens dos outros, e as que ela mesma
enviou por outra aba, aparecerem em até 1 s, na ordem da gravação e sem duplicar. Ao abrir outra
Conversa, aparecem também as que chegaram enquanto o servidor lia o histórico. Referências:
- spec da F03, "Eventos por Pessoa e reconexão" ("Publicação"), "Eventos" e "Cliente" ("Mensagens
  no histórico" e "Iniciais");
- LLD, "Transações" e "Concorrência e idempotência";
- PRD, história 1.

**Decisões consumidas de outras tarefas:**
- Contrato dos eventos, salas na conexão e provedor de conexão: 01.
- Base de sockets para a medição: 01.

**Bloqueada por:** 01 (Conexão em tempo real autenticada)

- [ ] **CA1** · Depois da gravação, e só quando a Mensagem foi gravada agora, a API emite
  `message.created` para a sala `person:` de cada Membro da Conversa. O reenvio do mesmo `client_id`
  não emite. Sem Redis nesta tarefa, o evento sai sem `event_id`.
- [ ] **CA2** · Na conexão, a API emite `sync` com `reset`. Com `reset`, a Conversa aberta busca de
  novo a página mais recente pela rota do BFF e substitui o cache por ela, mantendo as pendentes e o
  texto da caixa de mensagem.
- [ ] **CA3** · Uma função pura junta a Mensagem do evento ao cache: ordem por id, id repetido
  ignorado e a pendente de mesmo `client_id` retirada. A resposta do Server Action que chega depois
  não duplica. As pendentes continuam no fim.
- [ ] **CA4** · O provedor guarda, por Conversa, as últimas 100 Mensagens recebidas desde a conexão,
  e a Conversa que monta junta as que são mais novas que a primeira página do servidor.
- [ ] **CA5** · As iniciais do autor saem de uma função pura do web, usada pelo service do BFF e pelo
  cliente.
- [ ] **CA6** · Os testes de ponta a ponta da API provam que o evento chega a todos os sockets dos
  Membros, inclusive à outra aba do autor, e não chega a quem não é Membro, e que o reenvio não gera
  outro evento. O Vitest prova a junção e as iniciais.
- [ ] **CA7** · O Playwright prova a Mensagem da outra Pessoa aparecendo sem recarregar e a enviada
  por outra aba da mesma Pessoa aparecendo uma vez só.
- [ ] **CA8** · A medição do p95 entre a resposta do envio e a chegada do `message.created`, com 50
  sockets e 200 Mensagens, está em `medicao-p95.md` nesta pasta, com o critério do PRD (até 1 s).
