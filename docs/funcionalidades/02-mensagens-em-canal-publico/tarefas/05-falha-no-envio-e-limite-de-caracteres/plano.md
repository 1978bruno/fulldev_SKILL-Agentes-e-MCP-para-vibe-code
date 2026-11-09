# Plano da F02-T05: Falha no envio e limite de caracteres

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste HTTP

**Cenário:** Dado uma Mensagem já gravada, quando o mesmo autor envia de novo com o mesmo
`client_id`, então recebe 201 com a Mensagem já gravada (mesmo `id`), e o banco continua com uma
linha só. Dois envios simultâneos com o mesmo `client_id` gravam uma linha só e respondem os dois
com 201 e o mesmo `id`.

**Teste previsto:** e2e da API, `test/messages.e2e-spec.ts`, "o mesmo client_id devolve a
Mensagem já gravada, sem gravar outra" e "dois envios simultâneos com o mesmo client_id gravam uma
linha só".

### CA2

**Marca:** teste HTTP e teste de unidade

**Cenário:** Dado um texto com exatamente o `tamanho máximo da Mensagem` em emojis, então a API o
aceita; com um a mais, responde `validation_failed`. A função do web conta em pontos de código, e
um emoji conta 1. Vazio e só espaços seguem recusados (F02-T02).

**Teste previsto:** e2e da API, `test/messages.e2e-spec.ts`, "aceita exatamente o limite em
emojis" e "recusa um caractere acima do limite"; unidade (Vitest),
`src/app/utils/message-text.test.ts`.

### CA3

**Marca:** teste no Playwright

**Cenário:** Dado a caixa de mensagem, quando o texto passa do limite, então aparece "N
caracteres acima do limite" e o botão de enviar fica desabilitado; Enter não envia. Com a caixa
vazia, o botão também fica desabilitado.

**Teste previsto:** Playwright, `e2e/conversa/limite-de-caracteres.spec.ts`.

### CA4

**Marca:** teste no Playwright

**Cenário:** Dado o envio de uma Mensagem com a gravação segurada, então ela aparece no fim da
lista como "enviando" (com a opacidade do frame), e passa a gravada no mesmo lugar quando a
gravação termina. Ela segue a forma compacta como as outras.

**Teste previsto:** Playwright, `e2e/conversa/mensagem-enviando.spec.ts`.

### CA5

**Marca:** teste no Playwright

**Cenário:** Dado três Mensagens enviadas em sequência rápida, então elas aparecem e ficam
gravadas na ordem do envio, também depois de recarregar.

**Teste previsto:** Playwright, `e2e/conversa/envios-em-sequencia.spec.ts`.

### CA6

**Marca:** teste no Playwright

**Cenário:** Dado que o envio falha (o Server Action é abortado por `page.route`), então a
Mensagem fica com "Não foi possível enviar.", "Tentar de novo" e "Descartar". "Tentar de novo",
com a rede de volta, grava uma Mensagem só. "Descartar" tira outra Mensagem com falha da lista.
Recarregar a página tira as que falharam.

**Teste previsto:** Playwright, `e2e/conversa/falha-no-envio.spec.ts`.

### CA7

**Marca:** teste HTTP e teste de unidade

**Cenário:** Os de CA1 e CA2.

**Teste previsto:** os de CA1 e CA2.

### CA8

**Marca:** teste no Playwright

**Cenário:** Os de CA3 e CA6.

**Teste previsto:** os de CA3 e CA6.

### CA9

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quem revisa encontra `validacao-visual.md`, com
"Enviando" (22:11072), "Falha no envio" (22:12030) e "Composer / Acima do limite" (23:13781), nos
dois temas.

## Contrato

### POST /v1/conversations/:id/messages · alterada

| Item | Antes | Depois |
| --- | --- | --- |
| Resposta de sucesso | 201 com a Mensagem nova | 201 com a Mensagem nova, ou com a já gravada quando o mesmo autor repete o `client_id` |
| Erros | Um `client_id` repetido subia como 500 | Não há mais erro para o `client_id` repetido |

## Verificação do contrato

- 201 com a Mensagem já gravada: CA1.
- A unicidade em (`author_id`, `client_id`), que o banco já impunha: CA1.

## Decisões

- **Envio repetido na API:** a inserção usa `ON CONFLICT DO NOTHING` na unicidade (`author_id`,
  `client_id`) e, sem linha inserida, lê a Mensagem já gravada. O texto do reenvio é ignorado (spec
  da F02, "Mensagens").
- **Mensagens pendentes no cliente:** um estado do histórico fora do cache do SWR, com `sending` e
  `failed`, na ordem do envio, sempre depois das gravadas. Uma fila manda uma por vez; uma falha
  não trava as seguintes. Gravada, a Mensagem sai das pendentes e entra no cache, no mesmo lugar do
  fim da lista.
- **Autor da pendente:** a Pessoa da Sessão, que a página da Conversa lê pela leitura memorizada da
  F02-T02 e passa à lista.
- **A caixa esvazia ao enviar:** a Mensagem já está à vista como "enviando" e, se falhar, fica na
  lista com "Tentar de novo".
- **Contador:** aparece no lugar da dica "Shift + Enter" quando o texto passa do limite, em
  `danger-fg`, como no frame.

## Arquivos e interfaces

API: `src/messages/messages.service.ts` (`send` tolera o conflito).

Web:
- `src/app/hooks/use-pending-messages.ts`: a fila e os estados das pendentes.
- `src/app/hooks/use-message-history.ts`: as pendentes entram depois das gravadas.
- `src/app/components/message/message-item.tsx`: os estados `sending` e `failed`.
- `src/app/components/conversation/message-composer.tsx`: o contador e o envio pela fila.
- `src/app/components/conversation/message-history.tsx` e a página: a Pessoa da Sessão.
- `src/app/utils/message-text.test.ts`.
- `e2e/conversa/`: os testes de CA3 a CA6.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

- `docs/lld.md`, índice de rotas: o `POST /v1/conversations/:id/messages` deixa de marcar o
  reenvio como planejado, no commit da entrega.
