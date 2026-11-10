import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ConversationResponse,
  toConversationResponse,
} from '../conversations/conversation.response';
import { CreateConversationDto } from '../conversations/create-conversation.dto';
import { Person } from '../people/person.entity';
import { AuthGuard } from '../sessions/auth.guard';
import { CurrentPerson } from '../sessions/current-person.decorator';
import { AddMembersDto } from './add-members.dto';
import type { PersonSummary } from '../people/person-summary';
import { MembershipsService } from './memberships.service';
import { SearchPeopleQuery } from './search-people.query';

// As rotas que mudam quem é Membro de uma Conversa e avisam pelo tempo real, e a busca de quem
// adicionar (spec da F04, "Rotas").
@Controller()
@UseGuards(AuthGuard)
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Post('conversations')
  async create(
    @CurrentPerson() person: Person,
    @Body() body: CreateConversationDto,
  ): Promise<{ conversation: ConversationResponse }> {
    const created = await this.memberships.createChannel(person.id, {
      kind: body.kind,
      name: body.name,
      topic: body.topic,
      clientId: body.client_id,
    });
    return { conversation: toConversationResponse(created) };
  }

  @Post('conversations/:id/members')
  @HttpCode(200)
  async addMembers(
    @CurrentPerson() person: Person,
    @Param('id') id: string,
    @Body() body: AddMembersDto,
  ): Promise<{ added_person_ids: string[]; member_count: number }> {
    const added = await this.memberships.addMembers(
      person.id,
      id,
      body.person_ids,
    );
    return {
      added_person_ids: added.addedIds,
      member_count: added.memberCount,
    };
  }

  @Get('people')
  async searchPeople(
    @CurrentPerson() person: Person,
    @Query() query: SearchPeopleQuery,
  ): Promise<{ people: PersonSummary[] }> {
    const people = await this.memberships.searchPeople(
      person.id,
      query.not_member_of,
      query.q ?? '',
    );
    return { people };
  }
}
