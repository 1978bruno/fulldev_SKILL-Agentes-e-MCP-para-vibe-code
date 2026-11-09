# Plano da F02-T04: Mensagens agrupadas por autor e por dia

Tarefa: [tarefa.md](tarefa.md) · Spec: [spec.md](../../spec.md) · PRD: [prd.md](../../prd.md)

## Critérios

### CA1

**Marca:** teste de unidade

**Cenário:** Dado duas Mensagens seguidas, quando o autor é o mesmo, o dia no fuso é o mesmo e a
diferença está dentro do `intervalo da forma compacta`, então a segunda é compacta; mudando
qualquer uma das três condições, ela é completa. A lista usa o MessageItem compacto (22:7404).

**Teste previsto:** unidade (Vitest), `src/app/utils/message-grouping.test.ts`, "é compacta com o
mesmo autor, no mesmo dia e dentro do intervalo", "é completa com outro autor", "é completa no
dia seguinte do fuso, mesmo dentro do intervalo", "é compacta exatamente no limite do intervalo e
completa um milissegundo depois", "a primeira Mensagem é sempre completa".

### CA2

**Marca:** teste de unidade

**Cenário:** Dado um instante e o fuso, então o rótulo do dia é "Hoje", "Ontem", "3 de novembro"
no ano corrente e "3 de novembro de 2025" nos anteriores, e a hora é "14:10" em 24 h, as duas
no fuso passado.

**Teste previsto:** unidade (Vitest), `src/app/utils/day-label.test.ts` e
`src/app/utils/format-time.test.ts`.

### CA3

**Marca:** teste no Playwright

**Cenário:** Dado um navegador num fuso diferente do padrão, quando a Pessoa abre a Conversa,
então o cookie de fuso é gravado com o fuso do navegador e a hora das Mensagens sai nesse fuso,
sem aviso de hidratação no console.

**Teste previsto:** Playwright, `e2e/conversa/hora-no-fuso-do-navegador.spec.ts`, com
`timezoneId` diferente de `America/Sao_Paulo`.

### CA4

**Marca:** teste de unidade

**Cenário:** Dado um texto com endereços `http://` e `https://`, então a função separa os links do
texto, sem a pontuação final (`.`, `,`, `;`, `:`, `!`, `?`) e sem o `)` final que não abriu
dentro do link; outros esquemas (`javascript:`, `ftp://`, `www.`) ficam texto.

**Teste previsto:** unidade (Vitest), `src/app/utils/message-links.test.ts`.

### CA5

**Marca:** teste de unidade

**Cenário:** Os de CA1, CA2 e CA4, inclusive a virada de dia no fuso, a virada de ano e as bordas
exatas do intervalo.

**Teste previsto:** os de CA1, CA2 e CA4.

### CA6

**Marca:** teste no Playwright

**Cenário:** Dado um Canal com Mensagens em dias conhecidos e duas do mesmo autor com 2 minutos de
diferença, quando a Pessoa o abre, então a segunda é compacta (sem nome nem avatar) e os
divisores "Ontem" e "Hoje" separam os dias. Dado uma Mensagem com um link e outra com marcação
HTML, então o link abre em outra aba e a marcação aparece como texto.

**Teste previsto:** Playwright, `e2e/conversa/mensagens-agrupadas-por-dia.spec.ts` e
`e2e/conversa/links-e-texto-puro.spec.ts`.

### CA7

**Marca:** documento

**Cenário:** Dado a pasta desta tarefa, quem revisa encontra `validacao-visual.md` ("Mensagem /
Completa", "Mensagem / Compacta" e o divisor, nos dois temas) e `lighthouse.md`, com a nota de
Acessibilidade do Lighthouse na Conversa.

## Contrato

O contrato não muda.

## Verificação do contrato

Nenhuma: a tarefa não cria nem muda rota, evento ou tabela.

## Decisões

- **Cookie de fuso:** `fc_tz`, gravado por um componente cliente pequeno no layout logado, com os
  atributos do LLD ("Cookies do cliente"). O servidor lê o cookie na página da Conversa, confere
  que é um fuso IANA válido (um `Intl.DateTimeFormat` com ele não lança) e, sem cookie ou com um
  inválido, usa o `fuso padrão`. O fuso chega à lista como prop.
- **"Hoje" e "Ontem":** a página passa ao cliente o instante da renderização no servidor, e o
  rótulo é calculado contra ele dos dois lados, para a hidratação não divergir.
- **Divisor dentro da lista:** um `<li role="presentation">`, para o divisor ficar entre as
  Mensagens do `<ol>` sem contar como item, com o texto lido normalmente.
- **Hora da forma compacta:** fica na calha, invisível até o hover ou o foco na Mensagem, como no
  Figma, e sempre presente para o leitor de tela.
- **Links:** só `http://` e `https://`, abertos em outra aba com `rel="noopener noreferrer"`; o
  resto do texto é texto, com `white-space: pre-wrap`.
- **Fuso dos testes de ponta a ponta:** o `playwright.config.ts` fixa `timezoneId` em
  `America/Sao_Paulo`, para as horas esperadas nos testes não dependerem do fuso do contêiner. O
  teste de CA3 troca o fuso só para ele.
- **Lighthouse:** rodado pelo agente com o Lighthouse na linha de comando, no Chromium do contêiner
  `e2e`, com o cookie de uma Sessão de teste, e registrado em `lighthouse.md`.

## Arquivos e interfaces

- `src/app/utils/message-grouping.ts`: `isCompact(previous, current, timeZone)`.
- `src/app/utils/day-label.ts`: `dayKey(iso, timeZone)` e `dayLabel(iso, now, timeZone)`.
- `src/app/utils/format-time.ts`: sem mudança de interface (já recebe o fuso).
- `src/app/utils/time-zone.ts`: `TIME_ZONE_COOKIE`, `resolveTimeZone(value)`.
- `src/app/utils/message-links.ts`: `splitLinks(text)`.
- `src/app/components/session/time-zone-sync.tsx`: grava o cookie e renderiza de novo a rota.
- `src/app/components/message/message-item.tsx`: layout completo ou compacto, texto com links.
- `src/app/components/message/day-divider.tsx`: o DayDivider.
- `src/app/components/conversation/message-history.tsx`: monta as linhas com divisores e formas.
- `src/app/(app)/conversas/[id]/page.tsx` e `src/app/(app)/layout.tsx`: o fuso e o instante.
- `playwright.config.ts`: `timezoneId`.
- `e2e/conversa/`: os testes de CA3 e CA6.

## Testes existentes que mudam

Nenhum. O `ler-as-mensagens-recentes` espera "08:40" para 11:40 UTC, o que continua valendo com o
`timezoneId` fixado no fuso padrão.

## Mudança de dados

Nenhuma.

## Documentos atualizados

Nenhum: o LLD já registra os cookies, o fuso padrão e o intervalo da forma compacta.
