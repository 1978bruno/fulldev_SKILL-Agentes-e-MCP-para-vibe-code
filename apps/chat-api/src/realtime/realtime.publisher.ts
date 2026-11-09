import { Injectable } from '@nestjs/common';
import type { MessagePayload } from 'chat-events';
import { RealtimeGateway } from './realtime.gateway';
import { personRoom } from './realtime-socket';

// Emite os eventos guardados por Pessoa para as abas dela (spec da F03, "Eventos por Pessoa e
// reconexão"). Quem chama publica depois da gravação.
@Injectable()
export class RealtimePublisher {
  constructor(private readonly gateway: RealtimeGateway) {}

  messageCreated(memberIds: string[], message: MessagePayload): void {
    if (memberIds.length === 0) return;
    this.gateway.server.to(memberIds.map(personRoom)).emit('message.created', {
      message,
    });
  }
}
