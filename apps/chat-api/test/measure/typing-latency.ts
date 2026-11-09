// Medição do p95 do "digitando" (spec da F03, "Decisões de teste", "Medição"): 50 sockets de
// Pessoas diferentes com o mesmo Canal aberto e 200 avisos de typing.start, um por vez, alternando
// quem digita. Mede o tempo entre a emissão do aviso e a chegada em cada um dos outros sockets.
// Fora da suíte; roda no contêiner chat-api, no banco de testes:
//   pnpm exec ts-node test/measure/typing-latency.ts
import '../support/test-env';
import { performance } from 'node:perf_hooks';
import { authRoutes } from '../support/auth-routes';
import { conversationRoutes } from '../support/conversation-routes';
import {
  listenTestApp,
  openConversation,
  realtimeRoutes,
} from '../support/realtime-routes';

const SOCKETS = 50;
const ANNOUNCEMENTS = 200;

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
  const sockets = await Promise.all(
    people.map((person) =>
      realtimeRoutes.connected(url, { token: person.token }),
    ),
  );
  await Promise.all(
    sockets.map((socket) => openConversation(socket, channel.id)),
  );

  const latencies: number[] = [];
  for (let index = 0; index < ANNOUNCEMENTS; index += 1) {
    const typist = sockets[index % SOCKETS];
    const others = sockets.filter((socket) => socket !== typist);
    const startedAt = performance.now();
    const arrivals = others.map(
      (socket) =>
        new Promise<number>((resolve) =>
          socket.once('typing.start', () => resolve(performance.now())),
        ),
    );
    typist.emit('typing.start', { conversation_id: channel.id });
    for (const arrivedAt of await Promise.all(arrivals)) {
      latencies.push(arrivedAt - startedAt);
    }
  }

  const sorted = latencies.toSorted((a, b) => a - b);
  console.log(`Chegadas: ${sorted.length} de ${ANNOUNCEMENTS * (SOCKETS - 1)}`);
  console.log(`p50: ${percentile(sorted, 50).toFixed(1)} ms`);
  console.log(`p95: ${percentile(sorted, 95).toFixed(1)} ms`);
  console.log(`p99: ${percentile(sorted, 99).toFixed(1)} ms`);
  console.log(`máximo: ${sorted.at(-1)?.toFixed(1)} ms`);
  sockets.forEach((socket) => socket.disconnect());
  await app.close();
}

void main();
