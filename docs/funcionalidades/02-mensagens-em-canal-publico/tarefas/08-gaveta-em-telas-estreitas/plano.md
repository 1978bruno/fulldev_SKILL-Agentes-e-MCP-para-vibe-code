# Plano da F02-T08: Gaveta em telas estreitas

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** documento

**Cenário:** Dado o arquivo do Figma, quem revisa encontra:
- o frame "Casca / Gaveta / Aberta" (104:32864), em 767 × 900, na seção Casca, com a gaveta (o Rail e
  a Sidebar, com `elevation-3`) aberta sobre a Conversa e o overlay em `surface/surface-overlay`;
- o ConversationHeader com a propriedade booleana nova `Menu` ligada, que mostra o IconButton com
  `icon/menu` no começo do cabeçalho;
- o `icon/menu`, que já existia na seção Ícones.

A validação de CA5 traz a captura do frame.

### CA2

**Marca:** teste no Playwright

**Cenário:** Dado uma janela de 767 de largura:
- quando a Pessoa abre a Conversa, o Rail e a barra lateral não aparecem, e o botão "Abrir navegação"
  aparece no cabeçalho;
- quando ela clica no botão, a gaveta (um diálogo com o nome "Navegação") mostra o Rail e os Canais;
- quando ela aperta Esc, a gaveta fecha e o foco volta ao botão;
- quando ela abre a gaveta de novo e clica fora dela, a gaveta fecha;
- quando ela abre a gaveta e escolhe outro Canal, a URL muda e a gaveta fecha.

Na Home vazia, o botão também aparece.

**Teste previsto:** Playwright, `e2e/conversa/gaveta-em-tela-estreita.spec.ts`, e o caso da Home vazia
em `e2e/conversa/gaveta-na-home-vazia.spec.ts`.

### CA3

**Marca:** teste no Playwright

**Cenário:** Dado a janela padrão (1440), quando a Pessoa abre a Conversa, então o botão "Abrir
navegação" não aparece, e o Rail e a barra lateral aparecem.

**Teste previsto:** Playwright, no mesmo arquivo de CA2.

### CA4

**Marca:** teste no Playwright

**Cenário:** Os de CA2, e a checagem com `@axe-core/playwright` na gaveta aberta, sem violações.

**Teste previsto:** os de CA2, e `e2e/acessibilidade/gaveta-sem-violacoes.spec.ts`.

### CA5

**Marca:** documento

**Cenário:** Dado o `docs/design-system.md`, "Layout e responsividade", quem revisa encontra a
situação da gaveta atualizada. Dado a pasta desta tarefa, encontra `validacao-visual.md`, com a gaveta
em 767 nos dois temas, comparada ao frame novo.

## Contrato

O contrato não muda.

## Verificação do contrato

Nenhuma: a tarefa não cria nem muda rota, evento ou tabela.

## Decisões

- **Um componente cliente para a gaveta.** `NavigationDrawer` recebe o Rail e a barra lateral, que
  continuam Server Components, e os mostra de dois jeitos:
  - em `md` ou mais, em linha no shell, como antes;
  - abaixo de `md`, dentro do `Dialog.Content` do Radix, que só monta enquanto a gaveta está aberta.

  O `Dialog.Root` envolve o shell inteiro, e assim o botão do cabeçalho e o da Home são
  `Dialog.Trigger`. A volta do foco ao botão fica com o Radix.
- **Fechar ao escolher um Canal.** Um clique num link dentro da gaveta a fecha.
- **Botão "Abrir navegação".** É um IconButton com `icon/menu` e `md:hidden`, no começo do
  ConversationHeader, no esqueleto do cabeçalho e no topo da Home vazia e do erro da lista.
- **Visual.** A gaveta usa as larguras do Rail e da Sidebar, `shadow-3`, `z-40` e `animate-fade-in`.
  O overlay usa `bg-surface-overlay`, `z-30` e `animate-fade-in`. As linhas da barra lateral passam a
  44 px abaixo de `md` (design system, "Layout e responsividade").

## Arquivos e interfaces

- `src/app/components/workspace-nav/navigation-drawer.tsx`: o `NavigationDrawer` e o
  `OpenNavigationButton`.
- `src/app/(app)/layout.tsx`: o shell passa o Rail e a barra lateral à gaveta.
- `src/app/components/workspace-nav/sidebar.tsx` e `sidebar-row.tsx`: sem o `hidden md:flex`, e com
  a linha de 44 px abaixo de `md`.
- `src/app/components/conversation/conversation-header.tsx` e `conversation-header-skeleton.tsx`, e
  `src/app/(app)/page.tsx` e `conversation-list-error.tsx`: o botão.
- `e2e/`: os testes de CA2, CA3 e CA4.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

- `docs/design-system.md`, "Layout e responsividade": a situação da gaveta. "Comportamentos
  registrados no Figma": a propriedade `Menu` do ConversationHeader.
