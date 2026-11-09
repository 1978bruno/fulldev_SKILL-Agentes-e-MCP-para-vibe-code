# Medição do p95 do histórico (F02-T03)

2026-11-09 · ambiente de desenvolvimento (Docker no WSL2), PostgreSQL 18.6, API do chat em
`pnpm start:dev`, web em `next dev`, Chromium do contêiner `e2e`.

**Critério:** PRD da F02, história 4: abrir um Canal de até 100 mil Mensagens mostra as mais
recentes em até 1 s, no p95, e cada carga de Mensagens anteriores leva até 1 s, no p95.

## Como foi medido

Um teste temporário do Playwright, fora do repositório, fez o roteiro abaixo:
1. Criou uma Pessoa e um Canal, como as fixtures `person` e `memberChannel`.
2. Inseriu 100 mil Mensagens por SQL (`generate_series`, com `uuidv7()` deslocado para cada
   instante) e rodou `ANALYZE messages`.
3. Chamou a API do chat direto, `http://chat-api:3000`, com o cookie da Sessão: 200 chamadas
   seguidas à primeira página (`GET /v1/conversations/:id/messages`) e 200 a uma página do meio
   (`?before=` com a Mensagem de número 50 001).
4. Na tela, 20 vezes:
   - do `goto` da Conversa até a última Mensagem ficar visível;
   - de rolar até o topo até a página anterior entrar na lista.
5. Apagou o Canal no fim, e as Mensagens foram junto.

## Resultado

| Medida | p50 | p95 | Máximo | Teto do PRD |
| --- | --- | --- | --- | --- |
| API, primeira página | 3,4 ms | 4,5 ms | 7,6 ms | — |
| API, página do meio | 2,9 ms | 4,2 ms | 5,9 ms | — |
| Tela, abrir o Canal até a última Mensagem visível | 481 ms | 530 ms | 563 ms | 1 s |
| Tela, rolar ao topo até a página anterior aparecer | 136 ms | 173 ms | 174 ms | 1 s |

**Veredito:** dentro do critério, com folga. A consulta usa o índice (`conversation_id`, `id`) e
lê `tamanho da página` + 1 linhas, então o tempo da API não cresce com o tamanho do histórico. O
tempo de abrir a tela é quase todo do `next dev` (compilação e renderização em desenvolvimento), e
não da API.
