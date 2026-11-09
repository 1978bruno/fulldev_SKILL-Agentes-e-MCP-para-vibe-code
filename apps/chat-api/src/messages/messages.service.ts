import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { randomUUIDv7 } from 'node:crypto';
import { LessThan, Repository } from 'typeorm';
import { ConversationsService } from '../conversations/conversations.service';
import { PeopleService } from '../people/people.service';
import { ClientIdConflictError } from './client-id-conflict.error';
import { Message } from './message.entity';

export interface MessageAuthor {
  id: string;
  name: string;
}

export interface MessageView {
  id: string;
  conversationId: string;
  clientId: string;
  author: MessageAuthor;
  body: string;
  createdAt: Date;
}

export interface MessagePage {
  messages: MessageView[];
  hasMore: boolean;
}

export interface PageRequest {
  before?: string;
  limit: number;
}

export interface NewMessage {
  clientId: string;
  body: string;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly conversations: ConversationsService,
    private readonly people: PeopleService,
  ) {}

  private get messages(): Repository<Message> {
    return this.txHost.tx.getRepository(Message);
  }

  // Uma página do histórico, em ordem cronológica: as `limit` Mensagens anteriores a `before`, ou
  // as mais recentes sem ele. Uma linha a mais diz se há Mensagens anteriores (LLD, "Interfaces").
  async listPage(
    personId: string,
    conversationId: string,
    { before, limit }: PageRequest,
  ): Promise<MessagePage> {
    await this.conversations.getForMember(personId, conversationId);
    const newestFirst = await this.messages.find({
      where: {
        conversationId,
        ...(before ? { id: LessThan(before) } : {}),
      },
      order: { id: 'DESC' },
      take: limit + 1,
    });
    const hasMore = newestFirst.length > limit;
    const page = newestFirst.slice(0, limit).reverse();
    return { messages: await this.withAuthors(page), hasMore };
  }

  // Envio sem duplicar (LLD, "Concorrência e idempotência"): o mesmo `client_id` do mesmo autor
  // devolve a Mensagem já gravada, sem gravar outra; o texto do reenvio é ignorado. O conflito é
  // resolvido pela unicidade do banco, o que vale também para dois envios ao mesmo tempo.
  async send(
    author: MessageAuthor,
    conversationId: string,
    { clientId, body }: NewMessage,
  ): Promise<MessageView> {
    await this.conversations.getForMember(author.id, conversationId);
    const inserted = await this.messages
      .createQueryBuilder()
      .insert()
      .values({
        id: randomUUIDv7(),
        conversationId,
        authorId: author.id,
        clientId,
        body,
      })
      .orIgnore()
      .returning(['id', 'created_at'])
      .execute();
    const [row] = inserted.raw as { id: string; created_at: Date }[];
    // Sem conflito, a linha nova volta no RETURNING; com conflito, lê a que já estava lá.
    const message = row
      ? this.messages.create({
          id: row.id,
          conversationId,
          authorId: author.id,
          clientId,
          body,
          createdAt: row.created_at,
        })
      : await this.messages.findOneByOrFail({ authorId: author.id, clientId });
    // O mesmo client_id usado em outra Conversa não é reenvio desta.
    if (message.conversationId !== conversationId) {
      throw new ClientIdConflictError();
    }
    return toView(message, author);
  }

  // Os nomes dos autores vêm do PeopleService, numa consulta pelos ids da página.
  private async withAuthors(messages: Message[]): Promise<MessageView[]> {
    const authorIds = [...new Set(messages.map((message) => message.authorId))];
    const authors = new Map(
      (await this.people.findByIds(authorIds)).map((person) => [
        person.id,
        { id: person.id, name: person.name },
      ]),
    );
    return messages.map((message) =>
      toView(message, authors.get(message.authorId)!),
    );
  }
}

function toView(message: Message, author: MessageAuthor): MessageView {
  return {
    id: message.id,
    conversationId: message.conversationId,
    clientId: message.clientId,
    author,
    body: message.body,
    createdAt: message.createdAt,
  };
}
