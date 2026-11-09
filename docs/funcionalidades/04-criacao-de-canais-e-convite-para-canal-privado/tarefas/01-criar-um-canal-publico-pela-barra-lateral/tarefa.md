# 01: Criar um Canal público pela barra lateral

**Status:** concluída

**O que construir:** a Pessoa clica em "Adicionar canal", preenche o nome e o Tópico e cria um Canal
público, que abre vazio, com "Este é o começo do canal #nome" e o foco na caixa de mensagem. O nome
se ajusta à regra enquanto ela digita, o nome em uso aparece no campo, e uma nova tentativa depois
de uma falha nunca cria dois Canais. As outras Pessoas veem o Canal ao recarregar a página; a
chegada sem recarregar é da 03. Referências:
- spec da F04, "Conversas", "Rotas", "Módulos", "BFF" e "Cliente" ("Telas": barra lateral,
  diálogo "Criar canal" e "Depois de criar");
- LLD, "Concorrência e idempotência" ("Criação de Canal pelo produto");
- PRD, história 1.

**Bloqueada por:** Nenhuma (pode começar imediatamente)

- [x] **CA1** · No Figma, o rótulo "Descrição" do diálogo "Criar canal" vira "Tópico", nos três
  frames, e um frame novo mostra a falha ao criar, com o que foi preenchido
  (`docs/design-system.md`, "Do código para o Figma"), antes do código da tela.
- [x] **CA2** · `conversations` ganha `created_by` e `client_id`, opcionais, com unicidade parcial
  em (`created_by`, `client_id`), numa migração.
- [x] **CA3** · `POST /v1/conversations` cria o Canal público com a participação de todas as
  Pessoas, sob a trava de participação, na ordem da spec: o `client_id` repetido devolve o Canal já
  criado com 201, sem gravar outro, mesmo com outro nome; depois, nome e Tópico pela regra da F02;
  depois, `channel_name_taken` (409) com o nome normalizado no `detail`. Nesta tarefa, o `kind`
  aceita só `public_channel`; o resto recebe `validation_failed`.
- [x] **CA4** · A Conversa, em todas as rotas que a devolvem, ganha `member_count`. As listas por
  nome passam a ser ordenadas na aplicação por `Intl.Collator('pt-BR')`, numa função pura, também
  na lista de Conversas, e a web ganha a cópia dela, para a 03 inserir na mesma ordem.
- [x] **CA5** · O Server Action `createChannel` gera o `client_id` uma vez por diálogo aberto e o
  reenvia na nova tentativa, e devolve a união discriminada com `name_taken` e `invalid`. 401 leva a
  `GET /api/session/expired`.
- [x] **CA6** · A SidebarAction "Adicionar canal", no fim da seção "Canais", abre o diálogo nos
  estados Padrão, Erro no nome e Enviando. O nome passa, a cada tecla, pela função pura que espelha
  a regra da API (NFC, minúsculas, espaço vira `-`, os outros caracteres não entram, corte no
  limite). Criado o Canal, o diálogo leva a `/conversas/<id>`. Esc fecha e devolve o foco.
- [x] **CA7** · Os testes de ponta a ponta da API provam a criação com todas as Pessoas, o reenvio
  idempotente, o nome repetido, o nome e o Tópico inválidos, o `member_count`, a ordem da lista com
  acentos e o 401. A unidade prova a ordem; o Vitest, a normalização do nome.
- [x] **CA8** · O Playwright prova a criação pelo teclado, o nome digitado com maiúsculas e espaços
  normalizado, o nome repetido no campo e a falha ao criar pelo `page.route`, sem perder o que foi
  preenchido, e a checagem do axe no diálogo, sem violações.
- [x] **CA9** · A validação visual do diálogo, nos dois temas, contra os frames, fica nesta pasta.
