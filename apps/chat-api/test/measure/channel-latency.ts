// Medição do p95 dos Canais novos em tempo real (spec da F04, "Decisões de teste", "Medição"): 50
// sockets de Pessoas diferentes e 50 Canais públicos criados pelo REST, um por vez. A publicação
// sai fora da resposta, então o tempo é medido do início da criação até a chegada do
// conversation.member_added em cada socket, um teto do que o PRD pede (da resposta à chegada). O
// banco de testes tem milhares de Pessoas de outras suítes, e cada Canal público grava a participação
// de todas e guarda o evento no stream de cada uma. Fora da suíte; roda no contêiner chat-api:
//   pnpm exec ts-node test/measure/channel-latency.ts
import '../support/test-env';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import request from 'supertest';
import { App } from 'supertest/types';
import { authRoutes } from '../support/auth-routes';
import { listenTestApp, realtimeRoutes } from '../support/realtime-routes';
import { uniqueChannelName } from '../support/unique-channel-name';

const SOCKETS = 50;
const CHANNELS = 50;

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
  const arrivals = new Map<string, number[]>();
  const sockets = await Promise.all(
    people.map((person) =>
      realtimeRoutes.connected(url, { token: person.token }),
    ),
  );
  for (const socket of sockets) {
    socket.on('conversation.member_added', ({ conversation }) => {
      const list = arrivals.get(conversation.id) ?? [];
      list.push(performance.now());
      arrivals.set(conversation.id, list);
    });
  }

  const latencies: number[] = [];
  for (let index = 0; index < CHANNELS; index += 1) {
    const startedAt = performance.now();
    const response = await request(app.getHttpServer() as App)
      .post('/v1/conversations')
      .set('Cookie', people[index % SOCKETS].cookie)
      .send({
        kind: 'public_channel',
        name: uniqueChannelName('medicao'),
        client_id: randomUUID(),
      })
      .expect(201);
    const { id } = (response.body as { conversation: { id: string } })
      .conversation;
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
  const expected = SOCKETS * CHANNELS;
  console.log(`Chegadas: ${sorted.length} de ${expected}`);
  console.log(`p50: ${percentile(sorted, 50).toFixed(1)} ms`);
  console.log(`p95: ${percentile(sorted, 95).toFixed(1)} ms`);
  console.log(`p99: ${percentile(sorted, 99).toFixed(1)} ms`);
  console.log(`máximo: ${sorted.at(-1)?.toFixed(1)} ms`);
  sockets.forEach((socket) => socket.disconnect());
  await app.close();
}

void main();
