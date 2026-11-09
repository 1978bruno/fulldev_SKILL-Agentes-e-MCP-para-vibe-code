# Plano da F02-T06: Cair na última Conversa ao entrar

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste no Playwright

**Cenário:** Dado uma Pessoa que abre uma Conversa, então o navegador passa a ter o cookie da
última Conversa com o id dela, `Path=/`, `SameSite=Lax` e validade de 400 dias.

**Teste previsto:** Playwright, `e2e/conversa/home-abre-a-ultima-conversa.spec.ts` (confere o
cookie depois de abrir a Conversa).

### CA2

**Marca:** teste no Playwright

**Cenário:** Dado dois Canais e a segunda Conversa aberta antes, quando a Pessoa abre a Home,
então vai para a segunda. Dado um cookie com uma Conversa que não está na lista dela, então vai
para a primeira da lista. Sem Canais, vê "Nenhuma conversa ainda".

**Teste previsto:** Playwright, `e2e/conversa/home-abre-a-ultima-conversa.spec.ts`,
`e2e/conversa/home-ignora-conversa-fora-da-lista.spec.ts` e, para a Home vazia, o teste da F01
`e2e/login/entrar-ate-a-home.spec.ts`.

### CA3

**Marca:** revisão humana

**Cenário:** Dado o diff, quem revisa encontra o `loading.tsx` das telas logadas com os
esqueletos de "Home / Carregando" (19:1533), e a Home mostrando "Conversa / Erro ao carregar a
lista" (26:46375) quando a lista falha, com "Tentar de novo" que renderiza a rota de novo. A
verificação de CA5 mostra os dois na tela.

### CA4

**Marca:** teste no Playwright

**Cenário:** Os de CA1 e CA2, e a checagem com `@axe-core/playwright` na Home vazia sem violações
(já feita pelo teste da F01 `e2e/acessibilidade/entrar-e-home-sem-violacoes.spec.ts`).

**Teste previsto:** os de CA1 e CA2 e o teste de acessibilidade da F01.

### CA5

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quem revisa encontra `erro-da-lista.md`, com a
verificação do agente pelo `playwright-cli`: a tabela `conversations` renomeada no banco de
desenvolvimento, a Home com o erro, o nome desfeito e o "Tentar de novo" levando à Conversa; e
`validacao-visual.md`, com "Home / Carregando" e o erro nos dois temas.

## Contrato

O contrato não muda.

## Verificação do contrato

Nenhuma: a tarefa não cria nem muda rota, evento ou tabela.

## Decisões

- **Cookie da última Conversa:** `fc_last_conversation`, gravado por um componente cliente pequeno
  da página da Conversa, com os atributos do LLD ("Cookies do cliente") e a validade de 400 dias
  dos outros cookies (`COOKIE_MAX_AGE_SECONDS`). A Home lê o cookie por um service, como o de fuso.
- **Esqueletos:** um `MessageSkeleton` (componente do Figma) e uma pilha de seis, no `loading.tsx`
  das telas logadas, alinhada ao fim da área como no frame.
- **Erro da lista na Home:** o EmptyState do frame, com o título, a descrição e o Button primário
  "Tentar de novo", que chama `router.refresh()`. O erro da barra lateral é da F02-T07.

## Arquivos e interfaces

- `src/app/utils/last-conversation.ts`: `LAST_CONVERSATION_COOKIE`.
- `src/app/services/last-conversation-cookie.ts`: `readLastConversation()`.
- `src/app/components/conversation/remember-conversation.tsx`: grava o cookie ao abrir.
- `src/app/components/message/message-skeleton.tsx` e `src/app/(app)/loading.tsx`.
- `src/app/components/conversation/conversation-list-error.tsx`: o erro da lista com "Tentar de
  novo".
- `src/app/(app)/page.tsx`: a escolha da Conversa e o erro.
- `src/app/(app)/conversas/[id]/page.tsx`: monta o componente que lembra a Conversa.
- `e2e/conversa/`: os testes de CA1 e CA2.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

- `docs/lld.md`, tabela de telas: a Home deixa de marcar a última Conversa como planejada, no
  commit da entrega.
