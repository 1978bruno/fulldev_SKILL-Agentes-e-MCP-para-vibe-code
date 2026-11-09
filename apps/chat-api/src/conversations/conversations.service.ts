import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { randomUUIDv7 } from 'node:crypto';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PeopleService } from '../people/people.service';
import { ChannelNameTakenError } from './channel-name-taken.error';
import { parseChannelName, parseTopic } from './channel-name';
import { ConversationMember } from './conversation-member.entity';
import { ConversationNotFoundError } from './conversation-not-found.error';
import { Conversation } from './conversation.entity';
import { InvalidChannelError } from './invalid-channel.error';
import { lockPublicMembership } from './public-membership-lock';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly people: PeopleService,
  ) {}

  private get conversations(): Repository<Conversation> {
    return this.txHost.tx.getRepository(Conversation);
  }

  // Conversas de que a Pessoa é Membro, em ordem alfabética do nome.
  listForMember(personId: string): Promise<Conversation[]> {
    return this.memberConversations(personId)
      .orderBy('conversation.name', 'ASC')
      .getMany();
  }

  // A conferência de acesso única (LLD, "Segurança", "Participação numa Conversa"): toda rota e
  // todo service que recebe um id de Conversa passa por aqui.
  async getForMember(
    personId: string,
    conversationId: string,
  ): Promise<Conversation> {
    // Um id malformado não chega ao banco, que responderia erro de sintaxe.
    if (!isUUID(conversationId)) throw new ConversationNotFoundError();
    const conversation = await this.memberConversations(personId)
      .andWhere('conversation.id = :conversationId', { conversationId })
      .getOne();
    if (!conversation) throw new ConversationNotFoundError();
    return conversation;
  }

  // Cria o Canal público com a participação de todas as Pessoas, sob a trava de participação.
  @Transactional()
  async createPublicChannel(
    rawName: string,
    rawTopic?: string,
  ): Promise<Conversation> {
    const name = parseChannelName(rawName);
    if (!name.ok) throw new InvalidChannelError(name.error);
    const topic = parseTopic(rawTopic);
    if (!topic.ok) throw new InvalidChannelError(topic.error);

    // A trava serializa as criações de Canal: a conferência do nome não corre contra outra.
    await lockPublicMembership(this.txHost.tx);
    if (await this.conversations.existsBy({ name: name.value })) {
      throw new ChannelNameTakenError(name.value);
    }
    const channel = await this.conversations.save(
      this.conversations.create({
        kind: 'public_channel',
        name: name.value,
        topic: topic.value,
      }),
    );
    // Dois arrays como parâmetros, e não três parâmetros por Pessoa: o número de parâmetros não
    // cresce com o workspace.
    const personIds = await this.people.listIds();
    await this.txHost.tx.query(
      `INSERT INTO conversation_members (id, conversation_id, person_id)
       SELECT id, $1, person_id FROM unnest($2::uuid[], $3::uuid[]) AS rows(id, person_id)`,
      [channel.id, personIds.map(() => randomUUIDv7()), personIds],
    );
    return channel;
  }

  private memberConversations(
    personId: string,
  ): SelectQueryBuilder<Conversation> {
    return this.conversations
      .createQueryBuilder('conversation')
      .innerJoin(
        ConversationMember,
        'member',
        'member.conversation_id = conversation.id AND member.person_id = :personId',
        { personId },
      );
  }
}
