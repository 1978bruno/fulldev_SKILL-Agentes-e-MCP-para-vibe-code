import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { MESSAGE_PAGE_MAX_SIZE, MESSAGE_PAGE_SIZE } from './message-values';

// Paginação do histórico (LLD, "Interfaces"): `before` é o id da Mensagem mais antiga já recebida.
export class ListMessagesQuery {
  @IsOptional()
  @IsUUID()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MESSAGE_PAGE_MAX_SIZE)
  limit: number = MESSAGE_PAGE_SIZE;
}
