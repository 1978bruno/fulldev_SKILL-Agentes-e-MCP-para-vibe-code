import { IsOptional, IsString, IsUUID } from 'class-validator';

// Busca de Pessoas para adicionar a uma Conversa (spec da F04, "Busca de Pessoas").
export class SearchPeopleQuery {
  @IsOptional()
  @IsString()
  q?: string;

  @IsUUID()
  not_member_of!: string;
}
