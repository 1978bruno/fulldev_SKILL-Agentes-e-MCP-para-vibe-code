# 01: Bases de transação e de testes de unidade

**Status:** concluída

**O que construir:** as duas bases que deixam as próximas tarefas da F02 fáceis, sem comportamento
de produto novo:
- na API do chat, a transação que passa de um service a outro, de módulos diferentes, pelo
  contexto do CLS;
- na web, o Vitest para as funções puras.

O que se verifica é uma operação que grava por dois services e desfaz tudo quando um deles falha,
e a suíte da F01 continuando verde. Referências:
- spec da F02, "Módulos (API do chat)" ("Transação entre módulos") e "Decisões de teste" ("Web,
  Vitest para as funções puras");
- LLD, "Estrutura do código" (bibliotecas) e "Conceitos transversais de implementação",
  "Transações".

**Bloqueada por:** Nenhuma (pode começar imediatamente)

- [x] **CA1** · A API registra o `@nestjs-cls/transactional` com o adaptador do TypeORM, no módulo
  raiz e nos módulos dos comandos, que rodam fora do HTTP. A compatibilidade com o TypeORM 1.x está
  conferida. Se a biblioteca não servir, a tarefa para e a alternativa (passar o `EntityManager`
  à mão) volta ao usuário, porque muda o LLD.
- [x] **CA2** · O `PeopleService` acessa o banco pelo `TransactionHost`, e não pelo repositório
  injetado. O comportamento da F01 não muda.
- [x] **CA3** · Um teste de integração prova que uma operação marcada com `@Transactional()`, que
  grava por dois services de módulos diferentes, desfaz as duas gravações quando a segunda lança
  erro.
- [x] **CA4** · O comando de contas continua funcionando dentro de um contexto do CLS, e o teste
  de integração dele continua verde.
- [x] **CA5** · O projeto `web` tem o Vitest em ambiente Node, com um teste de exemplo de uma
  função pura que já existe, e o comando entra na "Verificação completa" do `AGENTS.md` do web.
- [x] **CA6** · O `AGENTS.md` da API registra como um service participa de uma transação
  (`@Transactional()` em quem orquestra e `TransactionHost` em quem participa).
- [x] **CA7** · A verificação completa da API e a da web passam no contêiner.
