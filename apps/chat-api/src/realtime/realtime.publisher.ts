import { Injectable, Logger } from '@nestjs/common';
import type { MessageCreatedEvent, MessagePayload } from 'chat-events';
import { EventsStore } from './events.store';
import { RealtimeGateway } from './realtime.gateway';
import { personRoom } from './realtime-socket';

// Emite os eventos guardados por Pessoa para as abas dela (spec da F03, "Eventos por Pessoa e
// reconexão"). Quem chama publica depois da gravação. Cada evento entra antes no stream de cada
// Pessoa, e cada sala recebe o cursor da sua; com o Redis fora, o evento sai sem cursor, e a
// reconexão seguinte recarrega.
@Injectable()
export class RealtimePublisher {
  private readonly logger = new Logger(RealtimePublisher.name);

  constructor(
    private readonly gateway: RealtimeGateway,
    private readonly events: EventsStore,
  ) {}

  async messageCreated(
    memberIds: string[],
    message: MessagePayload,
  ): Promise<void> {
    if (memberIds.length === 0) return;
    let cursors: Map<string, string>;
    try {
      cursors = await this.events.append(memberIds, {
        name: 'message.created',
        payload: { message } satisfies MessageCreatedEvent,
      });
    } catch (error) {
      this.logger.error('Falha ao guardar o evento no Redis', error);
      this.gateway.server
        .to(memberIds.map(personRoom))
        .emit('message.created', { message });
      return;
    }
    for (const personId of memberIds) {
      this.gateway.server.to(personRoom(personId)).emit('message.created', {
        event_id: cursors.get(personId),
        message,
      });
    }
  }
}
