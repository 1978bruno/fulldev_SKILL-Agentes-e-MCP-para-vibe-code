import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ConversationResponse,
  toConversationResponse,
} from '../conversations/conversation.response';
import { CreateConversationDto } from '../conversations/create-conversation.dto';
import { Person } from '../people/person.entity';
import { AuthGuard } from '../sessions/auth.guard';
import { CurrentPerson } from '../sessions/current-person.decorator';
import { MembershipsService } from './memberships.service';

// As rotas que mudam quem é Membro de uma Conversa e avisam pelo tempo real (spec da F04, "Rotas").
@Controller('conversations')
@UseGuards(AuthGuard)
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Post()
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
}
