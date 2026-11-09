import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { randomUUIDv7 } from 'node:crypto';
import { Repository, SelectQueryBuilder } from 'typeorm';
import type { NewPerson } from '../people/people.service';
import { PeopleService } from '../people/people.service';
import type { Person } from '../people/person.entity';
import { ChannelNameTakenError } from './channel-name-taken.error';
import { ChannelNotFoundError } from './channel-not-found.error';
import {
  normalizeChannelName,
  parseChannelName,
  parseTopic,
} from './channel-name';
import { ConversationMember } from './conversation-member.entity';
import { ConversationNotFoundError } from './conversation-not-found.error';
import { Conversation } from './conversation.entity';
import { InvalidChannelError } from './invalid-channel.error';
import { lockPublicMembership } from './public-membership-lock';

export type PublicChannelSummary = {
  name: string;
  topic: string | null;
  memberCount: number;
};

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
    const personIds = await this.people.listIds();
    await this.insertMembers(
      personIds.map((personId) => [channel.id, personId]),
    );
    return channel;
  }

  // Troca o Tópico de um Canal público pela regra do create; vazio apaga. Devolve o nome
  // normalizado.
  async setPublicChannelTopic(
    rawName: string,
    rawTopic: string,
  ): Promise<{ name: string; topic: string | null }> {
    const topic = parseTopic(rawTopic);
    if (!topic.ok) throw new InvalidChannelError(topic.error);
    const name = normalizeChannelName(rawName);
    const result = await this.conversations.update(
      { kind: 'public_channel', name },
      { topic: topic.value },
    );
    if (!result.affected) throw new ChannelNotFoundError(name);
    return { name, topic: topic.value };
  }

  // Canais públicos em ordem alfabética, com o número de Membros.
  async listPublicChannels(): Promise<PublicChannelSummary[]> {
    const rows = await this.conversations
      .createQueryBuilder('conversation')
      .leftJoin(
        ConversationMember,
        'member',
        'member.conversation_id = conversation.id',
      )
      .select('conversation.name', 'name')
      .addSelect('conversation.topic', 'topic')
      .addSelect('count(member.id)', 'member_count')
      .where("conversation.kind = 'public_channel'")
      .groupBy('conversation.id')
      .orderBy('conversation.name', 'ASC')
      .getRawMany<{
        name: string;
        topic: string | null;
        member_count: string;
      }>();
    return rows.map((row) => ({
      name: row.name,
      topic: row.topic,
      memberCount: Number(row.member_count),
    }));
  }

  // Cria a conta e a inclui em todos os Canais públicos, numa transação (ADR 0024). A Pessoa é
  // gravada antes da trava, para o hash da senha não segurá-la: um Canal criado ao mesmo tempo não
  // a vê (ainda não confirmada), e a leitura dos Canais, depois da trava, vê o Canal dele.
  @Transactional()
  async createPersonInPublicChannels(newPerson: NewPerson): Promise<Person> {
    const person = await this.people.create(newPerson);
    await lockPublicMembership(this.txHost.tx);
    await this.addToPublicChannels(person.id);
    return person;
  }

  // Só sob a trava de participação, dentro de createPersonInPublicChannels.
  private async addToPublicChannels(personId: string): Promise<void> {
    const channels = await this.conversations.find({
      select: { id: true },
      where: { kind: 'public_channel' },
    });
    await this.insertMembers(channels.map((channel) => [channel.id, personId]));
  }

  // Grava as participações (Conversa, Pessoa); a que já existe fica como está. Os ids saem da
  // aplicação, e os pares vão como arrays: o número de parâmetros não cresce com o workspace.
  private async insertMembers(pairs: [string, string][]): Promise<void> {
    await this.txHost.tx.query(
      `INSERT INTO conversation_members (id, conversation_id, person_id)
       SELECT * FROM unnest($1::uuid[], $2::uuid[], $3::uuid[])
       ON CONFLICT (conversation_id, person_id) DO NOTHING`,
      [
        pairs.map(() => randomUUIDv7()),
        pairs.map(([conversationId]) => conversationId),
        pairs.map(([, personId]) => personId),
      ],
    );
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
