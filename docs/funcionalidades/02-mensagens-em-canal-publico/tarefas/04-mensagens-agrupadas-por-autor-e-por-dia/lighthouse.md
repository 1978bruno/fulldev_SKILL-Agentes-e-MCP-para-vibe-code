# Lighthouse da Conversa (F02-T04)

2026-11-09 · Lighthouse 12.8.2, categoria Acessibilidade, preset desktop, no Chromium do contêiner
`e2e`, contra a web em `next dev`.

**Critério:** nota 100 de Acessibilidade na Conversa (PRD da F02, "Todas as histórias").

## Como foi rodado

O roteiro pede o Chrome DevTools. Nesta tarefa, o agente rodou o mesmo Lighthouse pela linha de
comando:
1. Criou uma Pessoa e um Canal com quatro Mensagens: uma de ontem, uma completa com um link, uma
   compacta logo depois e uma de outra Pessoa. A tela tem os divisores "Ontem" e "Hoje", as duas
   formas da Mensagem e um link.
2. Entrou pela API e gravou o cookie da Sessão e o de fuso num Chromium aberto com porta de
   depuração.
3. Rodou `lighthouse http://web:3000/conversas/<id> --port=9222 --disable-storage-reset
   --only-categories=accessibility --preset=desktop`.
4. Apagou o Canal e as Mensagens no fim.

## Resultado

| Página | Nota | Auditorias com peso | Aprovadas |
| --- | --- | --- | --- |
| `/conversas/<id>`, com divisores, forma compacta e link | **100** | 24 | 24 |

A página final foi a própria Conversa, sem redirecionamento para "Entrar". Antes desta medição, a
checagem com o axe (`e2e/acessibilidade/conversa-sem-violacoes.spec.ts`) apontou o
`<li role="presentation">` do divisor de dia dentro da lista, e o divisor passou para dentro do
item da primeira Mensagem do dia.
