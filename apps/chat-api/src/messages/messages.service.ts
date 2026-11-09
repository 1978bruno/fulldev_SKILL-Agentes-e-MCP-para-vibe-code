import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConversationsService } from '../conversations/conversations.service';
import { PeopleService } from '../people/people.service';
import { Message } from './message.entity';
import { MESSAGE_PAGE_SIZE } from './message-values';

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

  // A página mais recente, em ordem cronológica. Uma linha a mais diz se há Mensagens anteriores.
  async listLatest(
    personId: string,
    conversationId: string,
  ): Promise<MessagePage> {
    await this.conversations.getForMember(personId, conversationId);
    const newestFirst = await this.messages.find({
      where: { conversationId },
      order: { id: 'DESC' },
      take: MESSAGE_PAGE_SIZE + 1,
    });
    const hasMore = newestFirst.length > MESSAGE_PAGE_SIZE;
    const page = newestFirst.slice(0, MESSAGE_PAGE_SIZE).reverse();
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
