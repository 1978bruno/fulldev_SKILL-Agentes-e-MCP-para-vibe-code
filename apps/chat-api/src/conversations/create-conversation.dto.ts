import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import type { ChannelKind } from './conversations.service';

const CHANNEL_KINDS: ChannelKind[] = ['public_channel', 'private_channel'];

// Criação de Canal pelo produto (spec da F04, "Rotas"). A regra do nome e a do Tópico ficam no
// service ("channel-name.ts"), a mesma do comando de canais.
export class CreateConversationDto {
  @IsIn(CHANNEL_KINDS)
  kind!: ChannelKind;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  topic?: string;

  // Identificador gerado no cliente (LLD, "Concorrência e idempotência").
  @IsUUID()
  client_id!: string;
}
