import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import { Env } from '../config/env.schema';
import { PING_INTERVAL_MS, PING_TIMEOUT_MS } from './realtime-values';

// Opções do servidor do Socket.IO que dependem da configuração (spec da F03, "Conexão"). O
// decorator do gateway só aceita valores fixos, e o configureApp, que instala este adaptador,
// também roda nos testes.
export class ChatIoAdapter extends IoAdapter {
  private readonly webOrigin: string;

  constructor(app: INestApplication) {
    super(app);
    this.webOrigin = app
      .get<ConfigService<Env, true>>(ConfigService)
      .get('WEB_ORIGIN', { infer: true });
  }

  createIOServer(port: number, options?: Partial<ServerOptions>): unknown {
    return super.createIOServer(port, {
      ...options,
      transports: ['websocket'],
      pingInterval: PING_INTERVAL_MS,
      pingTimeout: PING_TIMEOUT_MS,
      // No transporte websocket o navegador não faz CORS: a origem é conferida aqui, no upgrade.
      allowRequest: (request, callback) => {
        callback(null, request.headers.origin === this.webOrigin);
      },
      cors: { origin: this.webOrigin, credentials: true },
    } satisfies Partial<ServerOptions>);
  }
}
