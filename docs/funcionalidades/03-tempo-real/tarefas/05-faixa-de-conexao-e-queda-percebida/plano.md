# Plano da F03-T05: Faixa de conexão e queda percebida

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste HTTP e teste no Playwright

**Cenário:**
- O servidor do Socket.IO usa o `ping do WebSocket` (intervalo de 10 s e espera de 5 s).
- Dada uma Pessoa conectada, quando o navegador fica offline, então o socket cai na hora (o estado
  vira "desconectada"); quando volta online, o socket conecta de novo sozinho.

**Teste previsto:** e2e da API, `test/realtime.e2e-spec.ts`, "o servidor usa o ping do WebSocket";
Playwright, `e2e/tempo-real/faixa-de-conexao.spec.ts`, "a faixa aparece depois de 3 s offline e some
ao voltar".

### CA2

**Marca:** teste no Playwright

**Cenário:** Dada uma Pessoa com a Conversa aberta, quando a conexão cai por mais de 3 s, então a
faixa "Sem conexão em tempo real. Reconectando…" aparece no topo da Casca, com `role="status"` e
sem receber o foco; quando a conexão volta, a faixa some. Quando a primeira conexão não acontece em
3 s, a faixa também aparece.

**Teste previsto:** Playwright, `e2e/tempo-real/faixa-de-conexao.spec.ts`, "a faixa aparece depois de
3 s offline e some ao voltar" e "a faixa aparece quando a primeira conexão não acontece".

### CA3

**Marca:** teste no Playwright

**Cenário:** Durante a queda, a Pessoa rola o histórico e envia; o envio que falha fica como na F02
("Não foi possível enviar.").

**Teste previsto:** Playwright, `e2e/tempo-real/faixa-de-conexao.spec.ts`, "durante a queda, o envio
segue a F02".

### CA4

**Marca:** teste no Playwright

**Cenário:** Uma queda mais curta que o `atraso da faixa de conexão` não mostra a faixa. A checagem
do `@axe-core/playwright` com a faixa na tela não tem violações.

**Teste previsto:** Playwright, `e2e/tempo-real/faixa-de-conexao.spec.ts`, "uma queda curta não
mostra a faixa"; `e2e/acessibilidade/faixa-de-conexao-sem-violacoes.spec.ts`.

### CA5

**Marca:** documento

**Cenário:** Quem revisa encontra nesta pasta `validacao-visual.md` e as capturas da faixa nos dois
temas, comparadas com o frame "Casca / Banner de reconexão" (25:31291).

## Contrato

O contrato não muda: o ping é configuração do servidor, sem evento novo.

## Verificação do contrato

Nenhuma.

## Decisões

- **Ping no adaptador.** O `ChatIoAdapter` passa `pingInterval: 10_000` e `pingTimeout: 5_000`, com
  as constantes num arquivo de valores do módulo `realtime`.
- **`offline` e `online` no provedor.** O provedor escuta os dois eventos da `window`: no `offline`
  chama `socket.disconnect()`, e no `online` chama `socket.connect()`, porque uma desconexão pedida
  pelo cliente desliga a reconexão automática.
- **Faixa com atraso.** `useConnectionBanner()` devolve se a faixa aparece: um timer de 3 s começa
  quando o estado deixa de ser "conectada" e é cancelado quando volta. O estado inicial,
  "conectando", conta como desconectado, para a primeira conexão que demora.
- **Componente `ConnectionBanner`.** Uma faixa de 26 px no topo da Casca, acima do Rail e da
  Conversa, com os tokens do Figma: `bg-warning`, `text-on-warning`, `text-small` em negrito, `px-4`,
  `gap-2` e o ícone `WifiOff` do Lucide. O layout logado passa a ser uma coluna com a faixa e o
  espaço de trabalho.
- **Queda simulada no Playwright** pelo `context.setOffline`, depois de a página abrir (o
  navegador dispara `offline` e `online`). A primeira conexão que não acontece é simulada pelo
  `routeWebSocket` sem encaminhar ao servidor.

## Arquivos e interfaces

- `apps/chat-api/src/realtime/chat-io.adapter.ts` e `realtime-values.ts`.
- `apps/chat-api/test/realtime.e2e-spec.ts`: o teste do ping.
- `apps/web/src/app/components/realtime/realtime-provider.tsx`: `offline` e `online`.
- `apps/web/src/app/components/realtime/connection-banner.tsx` e
  `apps/web/src/app/hooks/use-connection-banner.ts`.
- `apps/web/src/app/(app)/layout.tsx`: a faixa no topo da Casca.
- `apps/web/e2e/tempo-real/faixa-de-conexao.spec.ts` e
  `apps/web/e2e/acessibilidade/faixa-de-conexao-sem-violacoes.spec.ts`.

## Testes existentes que mudam

Nenhum.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum. Os valores já estão no LLD, "Valores e configuração".
