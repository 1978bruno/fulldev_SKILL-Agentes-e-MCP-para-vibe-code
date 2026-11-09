import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type {
  ConversationOpenResult,
  ConversationRef,
  HandshakeErrorCode,
} from 'chat-events';
import { ConversationNotFoundError } from '../conversations/conversation-not-found.error';
import { ConversationsService } from '../conversations/conversations.service';
import { Env } from '../config/env.schema';
import { readSessionCookie } from '../sessions/session-cookie';
import { SessionsService } from '../sessions/sessions.service';
import { UnauthenticatedError } from '../sessions/unauthenticated.error';
import { conversationRoom, personRoom, sessionRoom } from './realtime-socket';
import type { RealtimeServer, RealtimeSocket } from './realtime-socket';

const UNAUTHENTICATED: HandshakeErrorCode = 'unauthenticated';

// WebSocket da API do chat (spec da F03, "Conexão" e "Sessão no WebSocket"). O handshake verifica a
// Sessão pelo mesmo authenticate do guard REST e põe o socket nas salas da Pessoa e da Sessão.
@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: RealtimeServer;

  constructor(
    private readonly sessions: SessionsService,
    private readonly config: ConfigService<Env, true>,
    private readonly conversations: ConversationsService,
  ) {}

  afterInit(server: RealtimeServer): void {
    const cookieName = this.config.get('SESSION_COOKIE_NAME', { infer: true });
    server.use((socket, next) => {
      void this.authenticateSocket(socket, cookieName, next);
    });
  }

  // Sem o registro de eventos por Pessoa (tarefa 07), toda conexão pede à aba que recarregue a
  // página mais recente: nada se perde entre a leitura do histórico e a entrada nas salas.
  handleConnection(socket: RealtimeSocket): void {
    socket.emit('sync', { cursor: null, reset: true });
  }

  // A aba abre uma Conversa: confere a participação, como o REST, e põe o socket na sala dela, saindo
  // da Conversa que tinha aberto antes (spec da F03, "Digitando").
  @SubscribeMessage('conversation.open')
  async openConversation(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() event: ConversationRef,
  ): Promise<ConversationOpenResult> {
    const conversationId = event?.conversation_id;
    try {
      await this.conversations.getForMember(
        socket.data.person.id,
        typeof conversationId === 'string' ? conversationId : '',
      );
    } catch (error) {
      if (error instanceof ConversationNotFoundError) {
        return { ok: false, code: 'conversation_not_found' };
      }
      throw error;
    }
    const previous = socket.data.conversationId;
    if (previous && previous !== conversationId) {
      await socket.leave(conversationRoom(previous));
    }
    socket.data.conversationId = conversationId;
    await socket.join(conversationRoom(conversationId));
    return { ok: true };
  }

  @SubscribeMessage('conversation.close')
  async closeConversation(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() event: ConversationRef,
  ): Promise<void> {
    if (socket.data.conversationId !== event?.conversation_id) return;
    socket.data.conversationId = undefined;
    await socket.leave(conversationRoom(event.conversation_id));
  }

  @SubscribeMessage('typing.start')
  typingStart(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() event: ConversationRef,
  ): void {
    this.relayTyping(socket, event, 'typing.start');
  }

  @SubscribeMessage('typing.stop')
  typingStop(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() event: ConversationRef,
  ): void {
    this.relayTyping(socket, event, 'typing.stop');
  }

  // O "digitando" só passa entre as abas com a Conversa aberta, sem as da própria Pessoa, e não é
  // guardado. A participação já foi conferida no conversation.open: aqui basta a sala.
  private relayTyping(
    socket: RealtimeSocket,
    event: ConversationRef,
    name: 'typing.start' | 'typing.stop',
  ): void {
    const conversationId = event?.conversation_id;
    if (
      typeof conversationId !== 'string' ||
      !socket.rooms.has(conversationRoom(conversationId))
    ) {
      return;
    }
    const { id, name: personName } = socket.data.person;
    socket
      .to(conversationRoom(conversationId))
      .except(personRoom(id))
      .emit(name, {
        conversation_id: conversationId,
        person: { id, name: personName },
      });
  }

  // Grava a Pessoa e a Sessão no socket, ou recusa o handshake.
  private async authenticateSocket(
    socket: RealtimeSocket,
    cookieName: string,
    next: (error?: Error) => void,
  ): Promise<void> {
    const token = readSessionCookie(
      socket.handshake.headers.cookie,
      cookieName,
    );
    try {
      const { person, sessionId } = await this.sessions.authenticate(token);
      socket.data.person = person;
      socket.data.sessionId = sessionId;
      // As salas entram antes do CONNECT: nenhum evento emitido logo depois se perde.
      await socket.join([personRoom(person.id), sessionRoom(sessionId)]);
      next();
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        next(new Error(UNAUTHENTICATED));
        return;
      }
      // Outra falha também recusa, com outra mensagem: o cliente tenta de novo.
      this.logger.error('Falha ao verificar a Sessão no handshake', error);
      next(new Error('internal_error'));
    }
  }
}
