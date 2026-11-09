# 04: "Digitando"

**Status:** a fazer

**O que construir:** com a Conversa aberta, a Pessoa vê quem está digitando nela, com uma, duas ou
várias pessoas. O aviso some quando a pessoa envia, apaga o texto, troca de Conversa ou para de
digitar, e nunca mostra a própria Pessoa. Referências:
- spec da F03, "\"Digitando\"" e "Cliente" ("Telas", "Digitando");
- LLD, "Estados e regras" ("Digitando"), "Segurança" (participação numa Conversa) e "Valores e
  configuração";
- PRD, história 3.

**Decisões consumidas de outras tarefas:**
- Contrato dos eventos, provedor de conexão e estado da conexão: 01.
- Base de sockets para a medição: 01.

**Bloqueada por:** 01 (Conexão em tempo real autenticada)

- [ ] **CA1** · `conversation.open` confere a participação e põe o socket na sala da Conversa;
  responde `conversation_not_found` a quem não é Membro. A aba fica numa sala de Conversa por vez,
  sai dela ao trocar e abre de novo depois de uma reconexão.
- [ ] **CA2** · A API repassa `typing.start` e `typing.stop` só de um socket que está na sala, para
  a sala menos as abas da própria Pessoa, sem banco e sem Redis.
- [ ] **CA3** · A caixa de mensagem avisa no máximo a cada `intervalo do aviso de digitando`
  enquanto o texto não está vazio, e avisa que parou ao enviar, ao apagar todo o texto e ao trocar de
  Conversa.
- [ ] **CA4** · Quem vê tira a Pessoa no aviso de que parou ou depois da `expiração do digitando`. A
  queda da própria conexão esvazia a lista.
- [ ] **CA5** · Uma função pura dá o texto: "Fulano está digitando…", "Fulano e Beltrana estão
  digitando…" e "Várias pessoas estão digitando…". Ele aparece na linha reservada acima da caixa
  (21:8551), que não muda de altura e não é região `aria-live`.
- [ ] **CA6** · Os testes de ponta a ponta da API provam CA1 e CA2. O Vitest prova o texto.
- [ ] **CA7** · O Playwright prova o aviso com o nome, sumindo ao enviar e depois de 5 s sem
  digitar, e nunca mostrando a própria Pessoa. A checagem do axe com o aviso na tela não tem
  violações.
- [ ] **CA8** · O p95 do "digitando", na mesma base de medição, está em `medicao-p95.md` nesta pasta,
  com o critério do PRD (até 1 s). A validação visual, nos dois temas, também está registrada aqui.
