# Medição do p95 do "digitando"

2026-11-09 · F03-T04 · Critério: PRD da F03, história 3 (até 1 s no p95)

## Método

- Script `apps/chat-api/test/measure/typing-latency.ts`, rodado no contêiner `chat-api` com
  `pnpm exec ts-node test/measure/typing-latency.ts`, contra o banco de testes e a API subida pelo
  próprio script em `127.0.0.1`.
- 50 Pessoas diferentes, cada uma com um socket, todas com o mesmo Canal aberto
  (`conversation.open`).
- 200 avisos de `typing.start`, um por vez, alternando quem digita. Para cada aviso, o tempo é
  contado da emissão até a chegada em cada um dos outros 49 sockets.

## Resultado

| Medida | Valor |
| --- | --- |
| Chegadas | 9.800 de 9.800 |
| p50 | 0,5 ms |
| p95 | 0,9 ms |
| p99 | 2,1 ms |
| Máximo | 2,8 ms |

O p95 fica muito abaixo de 1 s. A medição é local, num único contêiner, sem a rede da produção.
