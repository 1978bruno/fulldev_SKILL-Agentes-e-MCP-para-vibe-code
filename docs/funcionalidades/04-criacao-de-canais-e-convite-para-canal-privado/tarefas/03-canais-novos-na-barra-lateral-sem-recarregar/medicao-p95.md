# Medição do p95 dos Canais novos em tempo real

2026-11-09 · F04-T03 · Critério: PRD da F04, história 4 (até 1 s no p95, sem recarregar)

## Método

- Script `apps/chat-api/test/measure/channel-latency.ts`, rodado no contêiner `chat-api` com
  `pnpm exec ts-node test/measure/channel-latency.ts`, contra o banco de testes e a API subida pelo
  próprio script em `127.0.0.1`.
- 50 Pessoas diferentes, cada uma com um socket conectado.
- 50 Canais públicos criados pelo REST, um por vez, alternando quem cria.
- O banco de testes tinha 4.468 Pessoas, deixadas pelas suítes. Cada Canal público grava a
  participação de todas elas e guarda o evento no stream de cada uma, como num workspace desse
  tamanho.
- A publicação sai fora da resposta da criação. O tempo é contado do início da criação até a
  chegada do `conversation.member_added` em cada socket: um teto do tempo que o PRD pede.

## Resultado

| Medida | Primeira versão | Versão entregue |
| --- | --- | --- |
| Chegadas | 2.500 de 2.500 | 2.500 de 2.500 |
| p50 | 2.594,9 ms | 99,7 ms |
| p95 | 3.020,6 ms | 127,9 ms |
| p99 | 3.132,4 ms | 143,9 ms |
| Máximo | 3.139,1 ms | 144,4 ms |

A primeira versão levava em `person_ids` todas as Pessoas do Canal, cerca de 170 KB por evento,
gravados no stream de cada uma das 4.468 Pessoas: o p95 ficou acima do critério. A versão entregue
manda a cada Pessoa só o que ela precisa (ela mesma, quando acabou de entrar), e a regra foi
registrada na spec da F04, "Tempo real". O p95 fica abaixo de 1 s.

A medição é local, num único contêiner, sem a rede da produção. As hipóteses de dimensionamento do
HLD seguem "A definir".
