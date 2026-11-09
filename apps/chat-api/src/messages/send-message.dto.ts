import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { MaxCodePoints } from '../common/validation/max-code-points';
import { NoNullCharacter } from '../common/validation/no-null-character';
import { MESSAGE_MAX_LENGTH } from './message-values';

export class SendMessageDto {
  // Identificador gerado no cliente (LLD, "Concorrência e idempotência").
  @IsUUID()
  client_id!: string;

  // Os espaços e as quebras de linha das pontas saem antes de validar (spec da F02, "Mensagens").
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxCodePoints(MESSAGE_MAX_LENGTH)
  @NoNullCharacter()
  body!: string;
}
