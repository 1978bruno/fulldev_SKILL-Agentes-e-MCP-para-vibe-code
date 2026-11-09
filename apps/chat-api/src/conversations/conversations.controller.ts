import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Person } from '../people/person.entity';
import { AuthGuard } from '../sessions/auth.guard';
import { CurrentPerson } from '../sessions/current-person.decorator';
import {
  ConversationResponse,
  toConversationResponse,
} from './conversation.response';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  async list(
    @CurrentPerson() person: Person,
  ): Promise<{ conversations: ConversationResponse[] }> {
    const conversations = await this.conversations.listForMember(person.id);
    return { conversations: conversations.map(toConversationResponse) };
  }

  @Get(':id')
  async get(
    @CurrentPerson() person: Person,
    @Param('id') id: string,
  ): Promise<{ conversation: ConversationResponse }> {
    const conversation = await this.conversations.getForMember(person.id, id);
    return { conversation: toConversationResponse(conversation) };
  }
}
