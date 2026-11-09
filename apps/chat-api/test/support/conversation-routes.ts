import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { ConversationsService } from '../../src/conversations/conversations.service';
import { Conversation } from '../../src/conversations/conversation.entity';
import { uniqueChannelName } from './unique-channel-name';
import { uuidV7At } from './uuid-v7-at';

// Atalhos da base de testes para Canais e Mensagens, no Arrange, sem asserção.
export const conversationRoutes = {
  // Pelo service, como o comando de canais: todas as Pessoas do banco viram Membros.
  createChannel(
    app: INestApplication,
    options: { name?: string; topic?: string } = {},
  ): Promise<Conversation> {
    return app
      .get(ConversationsService)
      .createPublicChannel(options.name ?? uniqueChannelName(), options.topic);
  },

  // Pelo REST, como a web: a Mensagem é gravada e publicada.
  sendMessage(
    app: INestApplication,
    cookie: string,
    conversationId: string,
    options: { clientId?: string; body?: string } = {},
  ): request.Test {
    return request(app.getHttpServer() as App)
      .post(`/v1/conversations/${conversationId}/messages`)
      .set('Cookie', cookie)
      .send({
        client_id: options.clientId ?? randomUUID(),
        body: options.body ?? 'Chegou na hora',
      });
  },

  async removeMembership(
    app: INestApplication,
    conversationId: string,
    personId: string,
  ): Promise<void> {
    await app
      .get(DataSource)
      .query(
        'DELETE FROM conversation_members WHERE conversation_id = $1 AND person_id = $2',
        [conversationId, personId],
      );
  },

  // Direto no banco, com o id UUID v7 no instante de cada Mensagem: a primeira em `startAt` e as
  // seguintes a cada `stepMs`, numa inserção só. Devolve os ids na ordem cronológica.
  async insertMessages(
    app: INestApplication,
    options: {
      conversationId: string;
      authorId: string;
      count: number;
      startAt?: Date;
      stepMs?: number;
    },
  ): Promise<string[]> {
    const start = (
      options.startAt ?? new Date(Date.now() - 86_400_000)
    ).getTime();
    const step = options.stepMs ?? 1000;
    const instants = Array.from(
      { length: options.count },
      (_, index) => start + index * step,
    );
    const ids = instants.map((at) => uuidV7At(at));
    await app.get(DataSource).query(
      `INSERT INTO messages (id, conversation_id, author_id, client_id, body, created_at, updated_at)
       SELECT id, $1, $2, gen_random_uuid(), 'Mensagem ' || position, at, at
       FROM unnest($3::uuid[], $4::timestamptz[]) WITH ORDINALITY AS rows(id, at, position)`,
      [
        options.conversationId,
        options.authorId,
        ids,
        instants.map((at) => new Date(at)),
      ],
    );
    return ids;
  },
};
