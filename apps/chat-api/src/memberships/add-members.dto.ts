import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';
import { MEMBERS_PER_ADD } from './membership-values';

// Pessoas a adicionar ao Canal privado (spec da F04, "Rotas").
export class AddMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MEMBERS_PER_ADD)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  person_ids!: string[];
}
