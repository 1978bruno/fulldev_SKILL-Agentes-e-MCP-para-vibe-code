import { INestApplication } from '@nestjs/common';
import type {
  ClientToServerEvents,
  ConversationOpenResult,
  ServerToClientEvents,
} from 'chat-events';
import { AddressInfo, Server } from 'node:net';
import { io, Socket } from 'socket.io-client';
import { createTestApp } from './create-test-app';
import { authRoutes } from './auth-routes';

export type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Mesma origem do WEB_ORIGIN do ambiente (compose.yaml).
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

// A aplicação ouvindo em 127.0.0.1 numa porta livre, para os testes do WebSocket.
export async function listenTestApp(): Promise<{
  app: INestApplication;
  url: string;
}> {
  const app = await createTestApp();
  await app.listen(0, '127.0.0.1');
  const server = app.getHttpServer() as Server;
  const { port } = server.address() as AddressInfo;
  return { app, url: `http://127.0.0.1:${port}` };
}

export interface ConnectOptions {
  token?: string;
  origin?: string | null;
  cursor?: string;
}

// Atalhos da base de testes para o WebSocket, no Arrange, sem asserção.
export const realtimeRoutes = {
  // Um socket ainda sem conectar, com o cookie e a origem que o teste pede.
  socket(
    url: string,
    { token, origin = WEB_ORIGIN, cursor }: ConnectOptions = {},
  ): TestSocket {
    const headers: Record<string, string> = {};
    if (token) headers.cookie = authRoutes.sessionCookie(token);
    if (origin !== null) headers.origin = origin;
    return io(url, {
      transports: ['websocket'],
      extraHeaders: headers,
      auth: cursor ? { cursor } : {},
      reconnection: false,
      autoConnect: false,
      forceNew: true,
    });
  },

  // Conecta e espera o resultado: o socket conectado, ou o erro do handshake.
  async connect(
    url: string,
    options: ConnectOptions = {},
  ): Promise<{ socket: TestSocket; error?: Error }> {
    const socket = realtimeRoutes.socket(url, options);
    return new Promise((resolve) => {
      socket.once('connect', () => resolve({ socket }));
      socket.once('connect_error', (error) => resolve({ socket, error }));
      socket.connect();
    });
  },

  // Conecta e falha sozinho se o handshake for recusado.
  async connected(
    url: string,
    options: ConnectOptions = {},
  ): Promise<TestSocket> {
    const { socket, error } = await realtimeRoutes.connect(url, options);
    if (error) throw error;
    return socket;
  },
};

type ServerEvent = keyof ServerToClientEvents;
type EventPayload<E extends ServerEvent> = Parameters<
  ServerToClientEvents[E]
>[0];

// Junta tudo o que o socket recebe de um evento, desde agora.
export function collectEvents<E extends ServerEvent>(
  socket: TestSocket,
  event: E,
): EventPayload<E>[] {
  const received: EventPayload<E>[] = [];
  const listener = (payload: EventPayload<E>) => received.push(payload);
  (
    socket.on as (
      event: string,
      listener: (payload: EventPayload<E>) => void,
    ) => void
  )(event, listener);
  return received;
}

// Espera até a lista ter `count` itens, ou falha depois de `timeoutMs`.
export async function waitForCount<T>(
  received: T[],
  count: number,
  timeoutMs = 2000,
): Promise<T[]> {
  const deadline = Date.now() + timeoutMs;
  while (received.length < count) {
    if (Date.now() > deadline) {
      throw new Error(
        `Esperava ${count} evento(s), chegaram ${received.length}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return received;
}

// Dá tempo para um evento que não deveria chegar aparecer.
export function settle(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Abre a Conversa no socket e devolve a confirmação; falha se ela não chega em 2 s.
export function openConversation(
  socket: TestSocket,
  conversationId: string,
): Promise<ConversationOpenResult> {
  return socket
    .timeout(2000)
    .emitWithAck('conversation.open', { conversation_id: conversationId });
}

// O motivo da próxima desconexão do socket.
export function nextDisconnection(socket: TestSocket): Promise<string> {
  return new Promise((resolve) => socket.once('disconnect', resolve));
}
