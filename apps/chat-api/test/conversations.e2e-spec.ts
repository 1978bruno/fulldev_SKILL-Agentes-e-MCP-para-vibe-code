import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { authRoutes } from './support/auth-routes';
import { conversationRoutes } from './support/conversation-routes';
import { createTestApp } from './support/create-test-app';
import { uniqueChannelName } from './support/unique-channel-name';

type ConversationBody = {
  id: string;
  kind: string;
  name: string | null;
  topic: string | null;
};

describe('conversas', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  const loggedIn = () => authRoutes.loggedIn(app);

  describe('GET /v1/conversations', () => {
    it('lista só as Conversas de que a Pessoa é Membro, em ordem alfabética', async () => {
      const { person, cookie } = await loggedIn();
      const second = await conversationRoutes.createChannel(app, {
        name: uniqueChannelName('b'),
      });
      const first = await conversationRoutes.createChannel(app, {
        name: uniqueChannelName('a'),
      });
      const outside = await conversationRoutes.createChannel(app);
      await conversationRoutes.removeMembership(app, outside.id, person.id);

      const response = await request(server)
        .get('/v1/conversations')
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      const ids = (
        response.body as { conversations: ConversationBody[] }
      ).conversations
        .map((conversation) => conversation.id)
        .filter((id) => [first.id, second.id, outside.id].includes(id));
      expect(ids).toEqual([first.id, second.id]);
    });

    it('responde 401 sem Sessão', async () => {
      const response = await request(server).get('/v1/conversations');

      expect(response.status).toBe(401);
      expect((response.body as { code: string }).code).toBe('unauthenticated');
    });
  });

  describe('GET /v1/conversations/:id', () => {
    it('responde 200 com a Conversa para um Membro', async () => {
      const { cookie } = await loggedIn();
      const channel = await conversationRoutes.createChannel(app, {
        topic: 'Conversas do time',
      });

      const response = await request(server)
        .get(`/v1/conversations/${channel.id}`)
        .set('Cookie', cookie);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        conversation: {
          id: channel.id,
          kind: 'public_channel',
          name: channel.name,
          topic: 'Conversas do time',
        },
      });
    });

    it('responde 404 para id inexistente, id malformado e Pessoa sem participação, com o mesmo corpo', async () => {
      const { person, cookie } = await loggedIn();
      const outside = await conversationRoutes.createChannel(app);
      await conversationRoutes.removeMembership(app, outside.id, person.id);

      const responses = await Promise.all(
        [randomUUID(), 'nao-e-um-uuid', outside.id].map((id) =>
          request(server).get(`/v1/conversations/${id}`).set('Cookie', cookie),
        ),
      );

      for (const response of responses) {
        expect(response.status).toBe(404);
        expect(response.body).toEqual(responses[0].body);
      }
      expect((responses[0].body as { code: string }).code).toBe(
        'conversation_not_found',
      );
    });

    it('responde 401 sem Sessão', async () => {
      const response = await request(server).get(
        `/v1/conversations/${randomUUID()}`,
      );

      expect(response.status).toBe(401);
    });
  });
});
