import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Env } from '../config/env.schema';
import { Person } from '../people/person.entity';
import { readSessionCookie } from './session-cookie';
import { SessionsService } from './sessions.service';

export interface AuthenticatedRequest extends Request {
  person: Person;
}

// Lê a Sessão do cookie que o BFF repassa (LLD, "Interfaces"). A F03 reaproveita a mesma
// verificação, pelo SessionsService.authenticate, no handshake do WebSocket.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readSessionCookie(
      request.headers.cookie,
      this.config.get('SESSION_COOKIE_NAME', { infer: true }),
    );
    request.person = await this.sessions.authenticate(token);
    return true;
  }
}
