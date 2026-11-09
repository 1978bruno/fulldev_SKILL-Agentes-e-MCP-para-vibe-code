# Medição do p95 das Mensagens em tempo real

2026-11-09 · F03-T02 · Critério: PRD da F03, história 1 (até 1 s no p95, da gravação à chegada)

## Método

- Script `apps/chat-api/test/measure/message-latency.ts`, rodado no contêiner `chat-api` com
  `pnpm exec ts-node test/measure/message-latency.ts`, contra o banco de testes e a API subida pelo
  próprio script em `127.0.0.1`.
- 50 Pessoas diferentes, cada uma com um socket conectado, todas Membros de um Canal novo.
- 200 Mensagens enviadas pelo REST, uma por vez, alternando a autora.
- A API publica o `message.created` antes de responder ao envio, então o evento costuma chegar antes
  da resposta. Por isso o tempo é contado do início do envio até a chegada em cada socket: um teto
  do tempo da gravação à chegada que o PRD pede.

## Resultado

| Medida | Valor |
| --- | --- |
| Chegadas | 10.000 de 10.000 |
| p50 | 8,1 ms |
| p95 | 10,5 ms |
| p99 | 12,2 ms |
| Máximo | 13,4 ms |

O p95 fica muito abaixo de 1 s. A medição é local, num único contêiner, sem a rede da produção;
as hipóteses de dimensionamento do HLD seguem "A definir".
