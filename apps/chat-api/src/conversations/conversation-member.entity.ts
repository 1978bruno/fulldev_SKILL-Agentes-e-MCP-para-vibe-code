import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../database/base.entity';
import { Person } from '../people/person.entity';
import { Conversation } from './conversation.entity';

// Participação de uma Pessoa numa Conversa, gravada também em Canal público (ADR 0024).
@Entity('conversation_members')
@Unique('conversation_members_conversation_person_key', [
  'conversationId',
  'personId',
])
export class ConversationMember extends BaseEntity {
  @Column({ type: 'uuid' })
  conversationId!: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: Conversation;

  @Index()
  @Column({ type: 'uuid' })
  personId!: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person?: Person;
}
