import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { MESSAGE_PAGE_SIZE } from '../src/messages/message-values';
import { authRoutes } from './support/auth-routes';
import { conversationRoutes } from './support/conversation-routes';
import { createTestApp } from './support/create-test-app';

type MessageBody = {
  id: string;
  conversation_id: string;
  client_id: string;
  author: { id: string; name: string };
  body: string;
  created_at: string;
};

describe('mensagens', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  async function memberOfNewChannel(name = 'Ana Souza') {
    const { person, email, password } = await authRoutes.createPerson(app, {
      name,
    });
    const token = await authRoutes.login(app, email, password);
    const channel = await conversationRoutes.createChannel(app);
    return { person, channel, cookie: authRoutes.sessionCookie(token) };
  }

  describe('GET /v1/conversations/:id/messages', () => {
    it('devolve a página mais recente em ordem cronológica, com has_more', async () => {
      const { person, channel, cookie } =
        await memberOfNewChannel('Bruno Lima');
      const ids = await conversationRoutes.insertMessages(app, {
        conversationId: channel.id,
        authorId: person.id,
        count: MESSAGE_PAGE_SIZE + 1,
      });

      const response = await request(server)
        .get(`/v1/conversations/${channel.id}/messages`)
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      const body = response.body as {
        messages: MessageBody[];
        has_more: boolean;
      };
      expect(body.has_more).toBe(true);
      expect(body.messages.map((message) => message.id)).toEqual(ids.slice(1));
      expect(body.messages[0]).toMatchObject({
        conversation_id: channel.id,
        author: { id: person.id, name: 'Bruno Lima' },
        body: 'Mensagem 2',
      });
    });

    it('responde has_more falso quando a página tem o histórico inteiro', async () => {
      const { person, channel, cookie } = await memberOfNewChannel();
      await conversationRoutes.insertMessages(app, {
        conversationId: channel.id,
        authorId: person.id,
        count: 2,
      });

      const response = await request(server)
        .get(`/v1/conversations/${channel.id}/messages`)
        .set('Cookie', cookie);

      const body = response.body as { messages: unknown[]; has_more: boolean };
      expect(body.messages).toHaveLength(2);
      expect(body.has_more).toBe(false);
    });

    it('responde 404 nas Mensagens de uma Conversa sem participação', async () => {
      const { person, channel, cookie } = await memberOfNewChannel();
      await conversationRoutes.removeMembership(app, channel.id, person.id);

      const response = await request(server)
        .get(`/v1/conversations/${channel.id}/messages`)
        .set('Cookie', cookie);

      expect(response.status).toBe(404);
      expect((response.body as { code: string }).code).toBe(
        'conversation_not_found',
      );
    });

    it('responde 401 sem Sessão', async () => {
      const response = await request(server).get(
        `/v1/conversations/${randomUUID()}/messages`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/conversations/:id/messages', () => {
    it('responde 201 e grava a Mensagem com a Pessoa da Sessão como autora', async () => {
      const { person, channel, cookie } =
        await memberOfNewChannel('Carla Dias');
      const clientId = randomUUID();

      const response = await request(server)
        .post(`/v1/conversations/${channel.id}/messages`)
        .set('Cookie', cookie)
        .send({ client_id: clientId, body: 'Bom dia!\nTudo certo?' });

      expect(response.status).toBe(201);
      const { message } = response.body as { message: MessageBody };
      expect(message).toMatchObject({
        conversation_id: channel.id,
        client_id: clientId,
        author: { id: person.id, name: 'Carla Dias' },
        body: 'Bom dia!\nTudo certo?',
      });
      const rows = await app
        .get(DataSource)
        .query<{ author_id: string; body: string }[]>(
          'SELECT author_id, body FROM messages WHERE id = $1',
          [message.id],
        );
      expect(rows).toEqual([
        { author_id: person.id, body: 'Bom dia!\nTudo certo?' },
      ]);
    });

    it('remove os espaços e as quebras de linha das pontas', async () => {
      const { channel, cookie } = await memberOfNewChannel();

      const response = await request(server)
        .post(`/v1/conversations/${channel.id}/messages`)
        .set('Cookie', cookie)
        .send({ client_id: randomUUID(), body: '\n  Olá, time  \n' });

      expect(response.status).toBe(201);
      expect((response.body as { message: MessageBody }).message.body).toBe(
        'Olá, time',
      );
    });

    it.each([
      ['texto vazio', { client_id: randomUUID(), body: '' }],
      ['só espaços', { client_id: randomUUID(), body: '  \n ' }],
      ['sem client_id', { body: 'Olá' }],
      ['client_id que não é uuid', { client_id: 'abc', body: 'Olá' }],
      [
        'texto com o caractere nulo',
        { client_id: randomUUID(), body: 'a\u0000b' },
      ],
    ])('recusa %s com validation_failed', async (_caso, payload) => {
      const { channel, cookie } = await memberOfNewChannel();

      const response = await request(server)
        .post(`/v1/conversations/${channel.id}/messages`)
        .set('Cookie', cookie)
        .send(payload);

      expect(response.status).toBe(400);
      expect((response.body as { code: string }).code).toBe(
        'validation_failed',
      );
    });

    it('responde 404 ao enviar numa Conversa sem participação', async () => {
      const { person, channel, cookie } = await memberOfNewChannel();
      await conversationRoutes.removeMembership(app, channel.id, person.id);

      const response = await request(server)
        .post(`/v1/conversations/${channel.id}/messages`)
        .set('Cookie', cookie)
        .send({ client_id: randomUUID(), body: 'Olá' });

      expect(response.status).toBe(404);
    });

    it('responde 401 sem Sessão', async () => {
      const response = await request(server)
        .post(`/v1/conversations/${randomUUID()}/messages`)
        .send({ client_id: randomUUID(), body: 'Olá' });

      expect(response.status).toBe(401);
    });
  });
});
