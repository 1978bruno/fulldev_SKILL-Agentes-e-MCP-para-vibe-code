import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Person } from '../people/person.entity';
import { AuthGuard } from '../sessions/auth.guard';
import { CurrentPerson } from '../sessions/current-person.decorator';
import { Conversation } from './conversation.entity';
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
    return { conversations: await this.withMemberCounts(conversations) };
  }

  @Post()
  async create(
    @CurrentPerson() person: Person,
    @Body() body: CreateConversationDto,
  ): Promise<{ conversation: ConversationResponse }> {
    const { conversation } = await this.conversations.createChannel(person.id, {
      kind: body.kind,
      name: body.name,
      topic: body.topic,
      clientId: body.client_id,
    });
    const [response] = await this.withMemberCounts([conversation]);
    return { conversation: response };
  }

  @Get(':id')
  async get(
    @CurrentPerson() person: Person,
    @Param('id') id: string,
  ): Promise<{ conversation: ConversationResponse }> {
    const conversation = await this.conversations.getForMember(person.id, id);
    const [response] = await this.withMemberCounts([conversation]);
    return { conversation: response };
  }

  private async withMemberCounts(
    conversations: Conversation[],
  ): Promise<ConversationResponse[]> {
    const counts = await this.conversations.countMembers(
      conversations.map((conversation) => conversation.id),
    );
    return conversations.map((conversation) =>
      toConversationResponse(conversation, counts.get(conversation.id) ?? 0),
    );
  }
}
