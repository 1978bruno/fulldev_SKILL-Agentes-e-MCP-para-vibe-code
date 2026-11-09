# Plano da F02-T07: Carregamento e erros da barra lateral e da Conversa

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** documento

**Cenário:** Dado a verificação do agente (CA6), quem revisa encontra a barra lateral com o
esqueleto (25:19071) enquanto a lista carrega e, quando ela falha, "Não foi possível carregar suas
conversas." com "Tentar de novo" (25:19177), com o resto do shell de pé.

### CA2

**Marca:** teste no Playwright

**Cenário:** Dado a seção "Canais", quando a Pessoa clica no título, ou aperta Enter nele pelo
teclado, então a seção recolhe (os Canais somem e o botão fica com `aria-expanded="false"`) e,
de novo, expande.

**Teste previsto:** Playwright, `e2e/conversa/secao-canais-recolhe.spec.ts`.

### CA3

**Marca:** teste no Playwright

**Cenário:** Dado dois Canais, quando a Pessoa abre um, então a linha dele fica ativa
(`aria-current="page"`) e a outra não; ao trocar de Canal e ao voltar no navegador, a linha ativa
acompanha.

**Teste previsto:** Playwright, `e2e/conversa/linha-ativa.spec.ts`.

### CA4

**Marca:** documento

**Cenário:** Dado a verificação do agente (CA6), quem revisa encontra a Conversa com "Histórico
carregando" (21:1869), o cabeçalho com o nome e os esqueletos, e, quando a primeira página falha,
"Não foi possível carregar as mensagens desta conversa." com "Tentar de novo" (21:4642), também
com o nome no cabeçalho.

### CA5

**Marca:** teste no Playwright

**Cenário:** Os de CA2 e CA3.

**Teste previsto:** os de CA2 e CA3.

### CA6

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quem revisa encontra `erros-e-carregamento.md`, com a
verificação do agente por um roteiro do Playwright: a tabela `conversations` travada (carregamento
da barra lateral), a tabela `messages` travada (Histórico carregando), a tabela `conversations`
renomeada (erro da barra lateral) e a tabela `messages` renomeada (erro do histórico), cada uma
desfeita e conferida com "Tentar de novo"; e `validacao-visual.md` nos dois temas.

## Contrato

O contrato não muda.

## Verificação do contrato

Nenhuma: a tarefa não cria nem muda rota, evento ou tabela.

## Decisões

- **A página da Conversa em duas partes:** a Conversa é lida primeiro e o cabeçalho sai com o nome;
  o histórico (Pessoa e primeira página) fica num `Suspense` com o fallback "Histórico carregando"
  (os esqueletos e a caixa de mensagem desabilitada). O `loading.tsx` do segmento `[id]`, para a
  troca de Canal, é o mesmo desenho com o cabeçalho em esqueleto, como em 25:19071.
- **Erro do histórico:** a falha da primeira página mostra o cabeçalho, a mensagem e o
  `RetryButton` secundário pequeno, e a caixa de mensagem. A falha da Conversa (sem nome para o
  cabeçalho) mostra o mesmo erro sem cabeçalho.
- **Erro da barra lateral:** o texto e o `RetryButton` secundário pequeno do frame, dentro do
  `Suspense` próprio da barra lateral.
- **Seção recolhível:** o título vira um botão com `aria-expanded` e `aria-controls`, e o chevron
  gira -90° quando recolhida. O estado não é guardado entre aberturas.
- **Linha ativa:** um componente cliente pequeno por linha, que compara o `usePathname()` com o
  endereço da Conversa e marca `aria-current="page"` com o fundo `sidebar-active`.

## Arquivos e interfaces

- `src/app/components/workspace-nav/sidebar.tsx`, `sidebar-section.tsx` (cliente, recolhível),
  `sidebar-row.tsx` (linha ativa), `sidebar-skeleton.tsx`, `sidebar-error.tsx`.
- `src/app/(app)/conversas/[id]/page.tsx` e `loading.tsx`.
- `src/app/components/conversation/history-loading.tsx` e `history-error.tsx`.
- `e2e/conversa/`: os testes de CA2 e CA3.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum.
