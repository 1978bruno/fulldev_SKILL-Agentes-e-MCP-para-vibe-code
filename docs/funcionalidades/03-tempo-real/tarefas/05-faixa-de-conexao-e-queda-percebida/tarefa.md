# 05: Faixa de conexão e queda percebida

**Status:** em andamento

**O que construir:** quando a conexão em tempo real cai, por falha da rede, do servidor ou depois de
o computador sair da suspensão, a Pessoa vê a faixa "Sem conexão em tempo real. Reconectando…" e o
chat reconecta sozinho. Uma oscilação curta não pisca na tela. Referências:
- spec da F03, "Conexão" (ping) e "Cliente" ("Conexão por aba" e "Telas", faixa de conexão);
- LLD, "Valores e configuração" ("Ping do WebSocket" e "Atraso da faixa de conexão");
- PRD, história 4.

**Decisões consumidas de outras tarefas:**
- Provedor de conexão e estado da conexão: 01.

**Bloqueada por:** 01 (Conexão em tempo real autenticada)

- [ ] **CA1** · O servidor usa o `ping do WebSocket`. O provedor desconecta no `offline` do navegador
  e conecta de novo no `online`. A reconexão segue o padrão do cliente, sem limite de tentativas.
- [ ] **CA2** · A ConnectionBanner (25:31291) aparece no topo da Casca depois do `atraso da faixa de
  conexão` desconectada, e também quando a primeira conexão não acontece nesse prazo. Some ao
  conectar. É `role="status"` e não recebe o foco.
- [ ] **CA3** · Durante a queda, a Pessoa lê, rola o histórico e envia, e a falha de envio segue a
  F02.
- [ ] **CA4** · O Playwright prova, com `context.setOffline` depois de a página abrir, a faixa
  aparecendo depois do atraso e sumindo ao voltar, e uma oscilação mais curta que o atraso sem faixa.
  A checagem do axe com a faixa na tela não tem violações.
- [ ] **CA5** · A validação visual da faixa, nos dois temas, está registrada nesta pasta.
