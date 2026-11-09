# 06: Sessão que acabou encerra o tempo real

**Status:** concluída

**O que construir:** quando a Pessoa sai em outra aba, ou a Sessão vence ou é revogada, a aba para de
receber Mensagens e "digitando" e vai para "Entrar". Uma aba aberta com a Sessão válida conta como
uso e a mantém viva. Referências:
- spec da F03, "Sessão no WebSocket";
- LLD, "Sessão e login" ("WebSocket") e "Valores e configuração" ("Intervalo de reconferência da
  Sessão no WebSocket");
- PRD, história 6.

**Decisões consumidas de outras tarefas:**
- Salas na conexão, contrato dos eventos e ida a "Entrar" pelo WebSocket: 01.

**Bloqueada por:** 01 (Conexão em tempo real autenticada)

- [x] **CA1** · Sair desconecta na hora os sockets da sala `session:` daquela Sessão, e só os dela.
- [x] **CA2** · Cada socket reconfere a Sessão a cada `intervalo de reconferência da Sessão no
  WebSocket`. Com a Sessão vencida ou revogada, a API emite `session.ended` e desconecta. A
  reconferência renova a Sessão como o REST.
- [x] **CA3** · No cliente, `session.ended` e a desconexão pelo servidor levam a
  `GET /api/session/expired` com o `?para=` da página atual.
- [x] **CA4** · Os testes de ponta a ponta da API provam CA1, e CA2 com o intervalo encurtado no
  módulo de teste, inclusive a renovação.
- [x] **CA5** · O Playwright prova que sair numa aba leva a outra aba da mesma Sessão a "Entrar".
