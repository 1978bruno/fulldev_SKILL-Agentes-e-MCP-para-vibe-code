import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Person } from '../people/person.entity';
import { AuthGuard } from '../sessions/auth.guard';
import { CurrentPerson } from '../sessions/current-person.decorator';
import {
  ConversationResponse,
  toConversationResponse,
} from './conversation.response';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './create-conversation.dto';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  async list(
    @CurrentPerson() person: Person,
  ): Promise<{ conversations: ConversationResponse[] }> {
    const conversations = await this.conversations.listForMember(person.id);
    const summaries = await this.conversations.withMemberCounts(conversations);
    return { conversations: summaries.map(toConversationResponse) };
  }

  @Post()
  async create(
    @CurrentPerson() person: Person,
    @Body() body: CreateConversationDto,
  ): Promise<{ conversation: ConversationResponse }> {
    const created = await this.conversations.createChannel(person.id, {
      kind: body.kind,
      name: body.name,
      topic: body.topic,
      clientId: body.client_id,
    });
    return { conversation: toConversationResponse(created) };
  }

  @Get(':id')
  async get(
    @CurrentPerson() person: Person,
    @Param('id') id: string,
  ): Promise<{ conversation: ConversationResponse }> {
    const conversation = await this.conversations.getForMember(person.id, id);
    const [summary] = await this.conversations.withMemberCounts([conversation]);
    return { conversation: toConversationResponse(summary) };
  }
}
