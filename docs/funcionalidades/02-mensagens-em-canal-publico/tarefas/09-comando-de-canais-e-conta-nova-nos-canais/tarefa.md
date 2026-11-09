# 09: Comando de canais completo e conta nova nos Canais

**Status:** concluída

**O que construir:** quem opera a instalação troca o Tópico de um Canal e lista os Canais que
existem. A conta que cria pelo comando de contas já entra em todos os Canais públicos, sem outro
passo, mesmo se um Canal for criado ao mesmo tempo. Referências:
- spec da F02, "Comando de canais", "Conversas e participação" ("Toda Pessoa em todo Canal
  público") e histórias 9 a 11;
- LLD, "Concorrência e idempotência" ("Participação em Canal público") e
  [ADR 0024](../../../../adr/0024-conversas-numa-tabela-so.md).

**Decisões consumidas de outras tarefas:**
- Transação entre módulos pelo CLS e `PeopleService` no `TransactionHost`: 01.
- Forma das tabelas e chave da trava de participação: 02.

**Bloqueada por:** 01 (Bases de transação e de testes de unidade), 02 (Abrir um Canal criado por
comando e enviar uma Mensagem)

- [x] **CA1** · O comando de canais tem `set-topic`, que troca o Tópico pela regra da spec e o
  apaga quando o Tópico é vazio, e `list`, que lista os Canais com nome, Tópico e número de
  Membros. Um nome que não existe é recusado, com mensagem.
- [x] **CA2** · O `create` do comando de contas grava a Pessoa e a participação dela em todos os
  Canais públicos numa transação só, que começa tomando a mesma trava de participação do `create`
  de canais.
- [x] **CA3** · Os testes de integração provam CA1 e CA2: a conta nova é Membro de todos os Canais
  públicos, e uma falha ao gravar a participação desfaz a criação da Pessoa.
- [x] **CA4** · O `AGENTS.md` da API lista as operações novas do comando de canais.
