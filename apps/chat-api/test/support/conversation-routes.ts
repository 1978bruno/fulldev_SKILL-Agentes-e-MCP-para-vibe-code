import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
  // seguintes a cada `stepMs`. Devolve os ids na ordem cronológica.
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
    const ids: string[] = [];
    for (let index = 0; index < options.count; index += 1) {
      const at = start + index * step;
      const id = uuidV7At(at);
      ids.push(id);
      await app.get(DataSource).query(
        `INSERT INTO messages (id, conversation_id, author_id, client_id, body, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [
          id,
          options.conversationId,
          options.authorId,
          randomUUID(),
          `Mensagem ${index + 1}`,
          new Date(at),
        ],
      );
    }
    return ids;
  },
};
