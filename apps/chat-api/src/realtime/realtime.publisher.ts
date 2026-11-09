import { Injectable, Logger } from '@nestjs/common';
import type {
  ConversationMemberAddedEvent,
  MessageCreatedEvent,
  MessagePayload,
} from 'chat-events';
import { EventsStore } from './events.store';
import { RealtimeGateway } from './realtime.gateway';
import { personRoom } from './realtime-socket';

// Os eventos guardados por Pessoa e o que cada um leva, sem o cursor, que é de cada Pessoa.
type StoredEventName = 'message.created' | 'conversation.member_added';
type StoredPayload = {
  'message.created': Omit<MessageCreatedEvent, 'event_id'>;
  'conversation.member_added': Omit<ConversationMemberAddedEvent, 'event_id'>;
};

// Emite os eventos guardados por Pessoa para as abas dela (spec da F03, "Eventos por Pessoa e
// reconexão"). Quem chama publica depois da gravação. Cada evento entra antes no stream de cada
// Pessoa, e cada sala recebe o cursor da sua; com o Redis fora, o evento sai sem cursor, e a
// reconexão seguinte das Pessoas afetadas recarrega.
@Injectable()
export class RealtimePublisher {
  private readonly logger = new Logger(RealtimePublisher.name);

  constructor(
    private readonly gateway: RealtimeGateway,
    private readonly events: EventsStore,
  ) {}

  messageCreated(memberIds: string[], message: MessagePayload): Promise<void> {
    return this.publish('message.created', memberIds, { message });
  }

  // Pessoas que entraram numa Conversa: vai para todos os Membros dela depois da gravação (spec da
  // F04, "Tempo real"). Quem entrou agora recebe person_ids só com ela mesma; quem já era Membro
  // recebe as Pessoas adicionadas. Assim o Canal público novo não leva o workspace inteiro em cada
  // um dos eventos guardados.
  memberAdded(
    memberIds: string[],
    conversation: ConversationMemberAddedEvent['conversation'],
    addedIds: string[],
  ): Promise<void> {
    const added = new Set(addedIds);
    return this.publish('conversation.member_added', memberIds, (personId) => ({
      conversation,
      person_ids: added.has(personId) ? [personId] : addedIds,
    }));
  }

  private async publish<N extends StoredEventName>(
    name: N,
    memberIds: string[],
    // A carga, a mesma para todos os Membros, ou montada para cada um.
    payload: StoredPayload[N] | ((personId: string) => StoredPayload[N]),
  ): Promise<void> {
    if (memberIds.length === 0) return;
    const payloadFor = (personId: string): StoredPayload[N] =>
      typeof payload === 'function' ? payload(personId) : payload;
    // O tipo de cada carga já vem de StoredPayload; o emit do Socket.IO não aceita o nome genérico.
    const emit = (rooms: string | string[], event: object) =>
      this.gateway.server
        .to(rooms)
        .emit(name as 'message.created', event as MessageCreatedEvent);
    let cursors: Map<string, string>;
    try {
      // A carga única é serializada uma vez só, para todos os streams.
      cursors = await this.events.append(
        memberIds,
        typeof payload === 'function'
          ? (personId) => ({ name, payload: payloadFor(personId) })
          : { name, payload },
      );
    } catch (error) {
      this.logger.error('Falha ao guardar o evento no Redis', error);
      this.events.markMissed(memberIds);
      for (const personId of memberIds) {
        emit(personRoom(personId), payloadFor(personId));
      }
      return;
    }
    for (const personId of memberIds) {
      emit(personRoom(personId), {
        event_id: cursors.get(personId),
        ...payloadFor(personId),
      });
    }
  }
}
