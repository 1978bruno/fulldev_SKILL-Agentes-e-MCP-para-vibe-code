import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Person } from '../people/person.entity';
import { AuthGuard } from '../sessions/auth.guard';
import { CurrentPerson } from '../sessions/current-person.decorator';
import { MessageResponse, toMessageResponse } from './message.response';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './send-message.dto';

@Controller('conversations/:conversationId/messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  async list(
    @CurrentPerson() person: Person,
    @Param('conversationId') conversationId: string,
  ): Promise<{ messages: MessageResponse[]; has_more: boolean }> {
    const page = await this.messages.listLatest(person.id, conversationId);
    return {
      messages: page.messages.map(toMessageResponse),
      has_more: page.hasMore,
    };
  }

  @Post()
  async send(
    @CurrentPerson() person: Person,
    @Param('conversationId') conversationId: string,
    @Body() body: SendMessageDto,
  ): Promise<{ message: MessageResponse }> {
    const message = await this.messages.send(
      { id: person.id, name: person.name },
      conversationId,
      { clientId: body.client_id, body: body.body },
    );
    return { message: toMessageResponse(message) };
  }
}
