import { Injectable, Logger } from '@nestjs/common';
import { toConversationResponse } from '../conversations/conversation.response';
import type {
  ConversationSummary,
  NewChannel,
} from '../conversations/conversations.service';
import { ConversationsService } from '../conversations/conversations.service';
import { RealtimePublisher } from '../realtime/realtime.publisher';

// Mudanças de participação que viram evento do tempo real (spec da F04, "Tempo real"): grava pelo
// service de Conversas, que é a transação, e só depois publica conversation.member_added para os
// Membros. Fica fora do módulo de Conversas porque o tempo real depende dele.
@Injectable()
export class MembershipsService {
  private readonly logger = new Logger(MembershipsService.name);

  constructor(
    private readonly conversations: ConversationsService,
    private readonly publisher: RealtimePublisher,
  ) {}

  // Cria o Canal e, só quando ele foi criado agora, avisa os Membros: todos eles entraram agora. O
  // reenvio do mesmo client_id não publica de novo.
  async createChannel(
    creatorId: string,
    newChannel: NewChannel,
  ): Promise<ConversationSummary> {
    const { created, ...summary } = await this.conversations.createChannel(
      creatorId,
      newChannel,
    );
    if (created) {
      await this.publishMemberAdded(summary, (memberIds) => memberIds);
    }
    return summary;
  }

  // Publica sem prender a resposta: a gravação já aconteceu, e a falha vai para o log, como no envio
  // de Mensagem.
  private async publishMemberAdded(
    summary: ConversationSummary,
    addedFrom: (memberIds: string[]) => string[],
  ): Promise<void> {
    try {
      const memberIds = await this.conversations.listMemberIds(
        summary.conversation.id,
      );
      void this.publisher
        .memberAdded(
          memberIds,
          toConversationResponse(summary),
          addedFrom(memberIds),
        )
        .catch((error: unknown) =>
          this.logger.error('Falha ao publicar a participação gravada', error),
        );
    } catch (error) {
      this.logger.error('Falha ao publicar a participação gravada', error);
    }
  }
}
