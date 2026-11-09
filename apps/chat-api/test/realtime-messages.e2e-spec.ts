import { INestApplication } from '@nestjs/common';
import type { MessageCreatedEvent } from 'chat-events';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { authRoutes } from './support/auth-routes';
import { conversationRoutes } from './support/conversation-routes';
import {
  collectEvents,
  listenTestApp,
  realtimeRoutes,
  settle,
  TestSocket,
  waitForCount,
} from './support/realtime-routes';

describe('Mensagens em tempo real', () => {
  let app: INestApplication;
  let url: string;
  const sockets: TestSocket[] = [];

  beforeAll(async () => {
    ({ app, url } = await listenTestApp());
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
  });

  afterAll(async () => {
    await app.close();
  });

  async function connected(token: string): Promise<TestSocket> {
    const socket = await realtimeRoutes.connected(url, { token });
    sockets.push(socket);
    return socket;
  }

  function send(
    cookie: string,
    conversationId: string,
    clientId = randomUUID(),
  ) {
    return request(app.getHttpServer() as App)
      .post(`/v1/conversations/${conversationId}/messages`)
      .set('Cookie', cookie)
      .send({ client_id: clientId, body: 'Chegou na hora' });
  }

  it('emite message.created para os Membros depois de gravar', async () => {
    const author = await authRoutes.loggedIn(app, { name: 'Ana Souza' });
    const reader = await authRoutes.loggedIn(app, { name: 'Bruno Lima' });
    const channel = await conversationRoutes.createChannel(app);
    const received = collectEvents(
      await connected(reader.token),
      'message.created',
    );

    const response = await send(author.cookie, channel.id);

    const [event] = await waitForCount(received, 1);
    expect(response.status).toBe(201);
    expect(event).toEqual<MessageCreatedEvent>({
      message: (response.body as { message: MessageCreatedEvent['message'] })
        .message,
    });
    expect(event.event_id).toBeUndefined();
  });

  it('o evento chega à outra aba do autor', async () => {
    const author = await authRoutes.loggedIn(app);
    const channel = await conversationRoutes.createChannel(app);
    const received = collectEvents(
      await connected(author.token),
      'message.created',
    );

    const response = await send(author.cookie, channel.id);

    const [event] = await waitForCount(received, 1);
    expect(event.message.id).toBe(
      (response.body as { message: { id: string } }).message.id,
    );
  });

  it('quem não é Membro não recebe o evento', async () => {
    const author = await authRoutes.loggedIn(app);
    const outsider = await authRoutes.loggedIn(app);
    const channel = await conversationRoutes.createChannel(app);
    await conversationRoutes.removeMembership(
      app,
      channel.id,
      outsider.person.id,
    );
    const received = collectEvents(
      await connected(outsider.token),
      'message.created',
    );

    await send(author.cookie, channel.id);

    await settle();
    expect(received).toHaveLength(0);
  });

  it('o reenvio do mesmo client_id não emite outro evento', async () => {
    const author = await authRoutes.loggedIn(app);
    const channel = await conversationRoutes.createChannel(app);
    const clientId = randomUUID();
    const received = collectEvents(
      await connected(author.token),
      'message.created',
    );
    await send(author.cookie, channel.id, clientId).expect(201);
    await waitForCount(received, 1);

    await send(author.cookie, channel.id, clientId).expect(201);

    await settle();
    expect(received).toHaveLength(1);
  });

  it('emite sync com reset na conexão', async () => {
    const { token } = await authRoutes.loggedIn(app);
    const socket = realtimeRoutes.socket(url, { token });
    sockets.push(socket);
    const received = collectEvents(socket, 'sync');

    socket.connect();

    const [event] = await waitForCount(received, 1);
    expect(event).toEqual({ cursor: null, reset: true });
  });
});
