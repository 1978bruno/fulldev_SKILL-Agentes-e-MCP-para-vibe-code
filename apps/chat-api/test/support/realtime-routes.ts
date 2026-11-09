import { INestApplication } from '@nestjs/common';
import type { ClientToServerEvents, ServerToClientEvents } from 'chat-events';
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
