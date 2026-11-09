# Plano da F03-T03: Pílula de novas mensagens

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste no Playwright

**Cenário:**
- Dadas duas Pessoas com o mesmo Canal aberto e a primeira no fim da lista, quando a outra envia,
  então a lista da primeira rola até a Mensagem nova.
- Dada a primeira lendo mais acima, a mais de `distância do fim da lista` do fim, quando a outra
  envia, então a lista não se move: a posição de rolagem fica a mesma.

**Teste previsto:** Playwright, `e2e/tempo-real/pilula-de-novas-mensagens.spec.ts`, "no fim, a
Mensagem que chega rola a lista" e "lendo mais acima, a lista não se move e aparece a pílula".

### CA2

**Marca:** teste no Playwright

**Cenário:** Dada a primeira Pessoa lendo mais acima, quando chega uma Mensagem, então aparece o
botão "Novas mensagens". Clicar nele leva ao fim e o faz sumir. Rolar até o fim também o faz sumir.

**Teste previsto:** Playwright, `e2e/tempo-real/pilula-de-novas-mensagens.spec.ts`, "lendo mais
acima, a lista não se move e aparece a pílula" e "a pílula some ao rolar até o fim".

### CA3

**Marca:** teste no Playwright

**Cenário:** Dada a Pessoa lendo mais acima, quando ela envia uma Mensagem, então a lista rola até o
fim e a pílula não aparece. A carga de anteriores continua devolvendo a rolagem à mesma Mensagem,
como provam os testes da F02.

**Teste previsto:** Playwright, `e2e/tempo-real/pilula-de-novas-mensagens.spec.ts`, "a Mensagem da
própria Pessoa sempre rola até o fim"; os testes da F02 de carga de anteriores seguem passando.

### CA4

**Marca:** teste no Playwright

**Cenário:** Com a pílula na tela, o Tab a alcança, Enter leva ao fim, e a checagem do
`@axe-core/playwright` não aponta violações.

**Teste previsto:** Playwright, `e2e/tempo-real/pilula-de-novas-mensagens.spec.ts`, "a pílula pelo
teclado leva ao fim"; `e2e/acessibilidade/pilula-sem-violacoes.spec.ts`.

### CA5

**Marca:** documento

**Cenário:** Quem revisa encontra nesta pasta `validacao-visual.md` e as capturas da pílula nos temas
claro e escuro, comparadas com o frame "Conversa / Lista / Novas mensagens abaixo" (21:9308).

## Contrato

O contrato não muda.

## Verificação do contrato

Nenhuma: a tarefa não cria nem muda rota, evento ou tabela.

## Decisões

- **"No fim" medido a cada rolagem.** Um manipulador de `scroll` guarda num ref se a distância até o
  fim é de até a `distância do fim da lista` (constante nova na web, 100 px, já no LLD). A chegada de
  uma Mensagem consulta esse ref, medido antes de ela entrar.
- **Quem rola é o efeito do último id, com a regra nova.** O efeito da F02 que rolava a cada último
  id novo passa a rolar só quando a Pessoa estava no fim ou quando a Mensagem nova é dela (inclusive
  a pendente "enviando"). Na abertura, rola sempre.
- **Pílula como componente próprio.** `NewMessagesPill`, um `<button>` com o ícone `ArrowDown` do
  Lucide e o texto "Novas mensagens", posicionado sobre o fim da lista, centralizado, com os tokens
  do Figma: `bg-primary`, `text-on-primary`, `text-small` em negrito, `rounded-pill`, `shadow-2`,
  `px-3`, `gap-2`, e a animação `pop-in` do design system.

## Arquivos e interfaces

- `apps/web/src/app/components/conversation/new-messages-pill.tsx`: `NewMessagesPill({ onClick })`.
- `apps/web/src/app/components/conversation/message-history.tsx`: o ref "no fim", o estado da
  pílula e a regra nova de rolagem.
- `apps/web/e2e/tempo-real/pilula-de-novas-mensagens.spec.ts` e
  `apps/web/e2e/acessibilidade/pilula-sem-violacoes.spec.ts`.

## Testes existentes que mudam

Nenhum: os testes da F02 abrem o Canal e enviam com a lista no fim, e a regra nova rola nesses casos.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum.
