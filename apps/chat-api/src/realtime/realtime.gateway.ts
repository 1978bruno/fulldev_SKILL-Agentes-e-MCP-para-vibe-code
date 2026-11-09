import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { HandshakeErrorCode } from 'chat-events';
import { Env } from '../config/env.schema';
import { readSessionCookie } from '../sessions/session-cookie';
import { SessionsService } from '../sessions/sessions.service';
import { UnauthenticatedError } from '../sessions/unauthenticated.error';
import { personRoom, sessionRoom } from './realtime-socket';
import type { RealtimeServer, RealtimeSocket } from './realtime-socket';

const UNAUTHENTICATED: HandshakeErrorCode = 'unauthenticated';

// WebSocket da API do chat (spec da F03, "Conexão" e "Sessão no WebSocket"). O handshake verifica a
// Sessão pelo mesmo authenticate do guard REST e põe o socket nas salas da Pessoa e da Sessão.
@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: RealtimeServer;

  constructor(
    private readonly sessions: SessionsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  afterInit(server: RealtimeServer): void {
    const cookieName = this.config.get('SESSION_COOKIE_NAME', { infer: true });
    server.use((socket, next) => {
      void this.authenticateSocket(socket, cookieName, next);
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
