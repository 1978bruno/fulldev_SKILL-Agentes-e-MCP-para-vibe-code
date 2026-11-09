import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
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
// Sessão pelo mesmo authenticate do guard REST, e o socket entra nas salas da Pessoa e da Sessão.
@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
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
      const token = readSessionCookie(
        socket.handshake.headers.cookie,
        cookieName,
      );
      this.sessions.authenticate(token).then(
        ({ person, sessionId }) => {
          socket.data.person = person;
          socket.data.sessionId = sessionId;
          next();
        },
        (error: unknown) => {
          if (!(error instanceof UnauthenticatedError)) {
            this.logger.error(
              'Falha ao verificar a Sessão no handshake',
              error,
            );
          }
          // Outra falha também recusa, com outra mensagem: o cliente tenta de novo.
          next(
            new Error(
              error instanceof UnauthenticatedError
                ? UNAUTHENTICATED
                : 'internal_error',
            ),
          );
        },
      );
    });
  }

  async handleConnection(socket: RealtimeSocket): Promise<void> {
    await socket.join([
      personRoom(socket.data.person.id),
      sessionRoom(socket.data.sessionId),
    ]);
  }
}
