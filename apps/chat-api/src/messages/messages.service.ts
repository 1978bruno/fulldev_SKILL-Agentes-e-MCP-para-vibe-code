import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { LessThan, Repository } from 'typeorm';
import { ConversationsService } from '../conversations/conversations.service';
import { PeopleService } from '../people/people.service';
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

  async send(
    author: MessageAuthor,
    conversationId: string,
    { clientId, body }: NewMessage,
  ): Promise<MessageView> {
    await this.conversations.getForMember(author.id, conversationId);
    const message = await this.messages.save(
      this.messages.create({
        conversationId,
        authorId: author.id,
        clientId,
        body,
      }),
    );
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
