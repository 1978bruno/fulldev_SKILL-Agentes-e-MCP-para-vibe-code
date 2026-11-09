import { Check, Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../database/base.entity';
import { CHANNEL_NAME_MAX_LENGTH, TOPIC_MAX_LENGTH } from './channel-name';

// Canais e Conversas diretas numa tabela só (ADR 0024). A F02 cria só o Canal público; a F04 e a
// F05 acrescentam os outros tipos ao CHECK.
export type ConversationKind = 'public_channel';

@Entity('conversations')
@Check('conversations_kind_check', `"kind" IN ('public_channel')`)
@Check(
  'conversations_channel_name_check',
  `"kind" <> 'public_channel' OR "name" IS NOT NULL`,
)
@Check(
  'conversations_name_length_check',
  `char_length("name") BETWEEN 1 AND ${CHANNEL_NAME_MAX_LENGTH}`,
)
@Check(
  'conversations_topic_length_check',
  `char_length("topic") <= ${TOPIC_MAX_LENGTH}`,
)
@Index('conversations_name_key', ['name'], {
  unique: true,
  where: '"name" IS NOT NULL',
})
export class Conversation extends BaseEntity {
  @Column({ type: 'text' })
  kind!: ConversationKind;

  @Column({ type: 'text', nullable: true })
  name!: string | null;

  @Column({ type: 'text', nullable: true })
  topic!: string | null;
}
