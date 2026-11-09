# 07: Recuperar o que se perdeu sem recarregar

**Status:** concluída

**O que construir:** depois de uma queda de até 5 minutos, a Pessoa vê na Conversa aberta as
Mensagens que chegaram no meio, na ordem, sem duplicar e sem recarregar a página. Se algo se perdeu
de fato, a Conversa recarrega as mais recentes sem perder o texto da caixa de mensagem. Referências:
- spec da F03, "Eventos por Pessoa e reconexão", "Cliente" ("Conexão por aba" e "Mensagens no
  histórico") e "Configuração e ambiente";
- LLD, "Integrações externas" ("Eventos por pessoa"), "Valores e configuração" e "Ambiente de
  desenvolvimento";
- HLD 6.2 e ADR 0007;
- PRD, história 5.

**Decisões consumidas de outras tarefas:**
- Contrato dos eventos e estado da conexão: 01.
- `sync`/`reset`, recarga da página mais recente e junção no cache: 02.
- O que conta como "no fim da lista", e a pílula: 03.
- Ping e escuta do `offline`: 05.

**Bloqueada por:** 03 (Pílula de novas mensagens), 05 (Faixa de conexão e queda percebida)

- [x] **CA1** · O serviço `redis` (`redis:8`) entra no compose, com healthcheck e volume, e a
  `chat-api` depende dele. `REDIS_URL` e `TEST_REDIS_URL` entram no schema de configuração. A tabela
  de serviços do `AGENTS.md` da raiz e o LLD, "Ambiente de desenvolvimento", ganham a linha.
- [x] **CA2** · Cada evento entra no stream da Pessoa com o corte da `retenção dos eventos de
  reconexão`, e o `message.created` leva o cursor `<época>:<id>`.
- [x] **CA3** · A conexão segue a ordem da spec: salas, reenvio depois do cursor, `sync`. O `reset`
  só vem na primeira conexão, com época diferente ou com o corte posterior ao cursor.
- [x] **CA4** · O provedor guarda o cursor em memória, manda-o no handshake e, até o `sync`, aplica
  os eventos em ordem de id de evento, sem repetir. As Mensagens recuperadas seguem a regra da
  pílula.
- [x] **CA5** · Com o Redis fora, o envio responde 201, o evento sai sem `event_id` e um `error` vai
  para o log. A reconexão seguinte responde `reset`.
- [x] **CA6** · Os testes de ponta a ponta da API provam o reenvio em ordem, o `reset` sem cursor,
  com outra época e com o corte posterior ao cursor, e o Redis fora.
- [x] **CA7** · O Playwright prova a queda curta com `setOffline`: a outra Pessoa envia, a Mensagem
  aparece uma vez e sem recarregar. Prova também a época apagada no Redis durante a queda: a Conversa
  recarrega as mais recentes e mantém o texto da caixa. O serviço `e2e` ganha `REDIS_URL`.
- [ ] **CA8** · O roteiro manual está nesta pasta: a nota 100 de Acessibilidade do Lighthouse na
  Conversa com a faixa e a pílula, e uma queda de verdade (Wi-Fi desligado e computador suspenso por
  1 min).
