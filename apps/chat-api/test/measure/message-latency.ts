// Medição do p95 do tempo real (spec da F03, "Decisões de teste", "Medição"): 50 sockets de Pessoas
// diferentes num Canal e 200 Mensagens enviadas pelo REST, uma por vez. A API publica antes de
// responder, então o evento costuma chegar antes da resposta; por isso o tempo é medido do início
// do envio até a chegada do message.created em cada socket, um teto do que o PRD pede (da gravação
// à chegada). Fora
// da suíte; roda no contêiner chat-api, no banco de testes:
//   pnpm exec ts-node test/measure/message-latency.ts
import '../support/test-env';
import { performance } from 'node:perf_hooks';
import { authRoutes } from '../support/auth-routes';
import { conversationRoutes } from '../support/conversation-routes';
import { listenTestApp, realtimeRoutes } from '../support/realtime-routes';

const SOCKETS = 50;
const MESSAGES = 200;

function percentile(sorted: number[], p: number): number {
  return sorted[
    Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  ];
}

async function main(): Promise<void> {
  const { app, url } = await listenTestApp();
  const people = await Promise.all(
    Array.from({ length: SOCKETS }, (_, index) =>
      authRoutes.loggedIn(app, { name: `Pessoa ${index}` }),
    ),
  );
  const channel = await conversationRoutes.createChannel(app);
  const arrivals = new Map<string, number[]>();
  const sockets = await Promise.all(
    people.map((person) =>
      realtimeRoutes.connected(url, { token: person.token }),
    ),
  );
  for (const socket of sockets) {
    socket.on('message.created', ({ message }) => {
      const list = arrivals.get(message.id) ?? [];
      list.push(performance.now());
      arrivals.set(message.id, list);
    });
  }

  const latencies: number[] = [];
  for (let index = 0; index < MESSAGES; index += 1) {
    const startedAt = performance.now();
    const response = await conversationRoutes
      .sendMessage(app, people[index % SOCKETS].cookie, channel.id, {
        body: `Medição ${index}`,
      })
      .expect(201);
    const { id } = (response.body as { message: { id: string } }).message;
    const deadline = performance.now() + 5000;
    while (
      (arrivals.get(id)?.length ?? 0) < SOCKETS &&
      performance.now() < deadline
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    for (const arrivedAt of arrivals.get(id) ?? []) {
      latencies.push(arrivedAt - startedAt);
    }
  }

  const sorted = latencies.toSorted((a, b) => a - b);
  const expected = SOCKETS * MESSAGES;
  console.log(`Chegadas: ${sorted.length} de ${expected}`);
  console.log(`p50: ${percentile(sorted, 50).toFixed(1)} ms`);
  console.log(`p95: ${percentile(sorted, 95).toFixed(1)} ms`);
  console.log(`p99: ${percentile(sorted, 99).toFixed(1)} ms`);
  console.log(`máximo: ${sorted.at(-1)?.toFixed(1)} ms`);
  sockets.forEach((socket) => socket.disconnect());
  await app.close();
}

void main();
