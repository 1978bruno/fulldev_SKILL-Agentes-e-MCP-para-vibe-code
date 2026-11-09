import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Env } from '../config/env.schema';
import { LoginAttemptsService } from '../login-attempts/login-attempts.service';
import { normalizeEmail } from '../people/normalize-email';
import { PeopleService } from '../people/people.service';
import { Person } from '../people/person.entity';
import { InvalidCredentialsError } from './invalid-credentials.error';
import { Session } from './session.entity';
import { generateSessionToken, hashSessionToken } from './session-token';
import { UnauthenticatedError } from './unauthenticated.error';

const DAY_MS = 24 * 60 * 60 * 1000;

// Intervalo de renovação da Sessão (LLD, "Valores e configuração"): no máximo uma escrita por
// Sessão a cada intervalo.
const RENEWAL_INTERVAL_MS = DAY_MS;

export interface AuthenticatedSession {
  sessionId: string;
  person: Person;
}

export interface LoginResult {
  token: string;
  person: Person;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    private readonly people: PeopleService,
    private readonly loginAttempts: LoginAttemptsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // Ordem do limite de tentativas (LLD, "Sessão e login"): e-mail normalizado, bloqueio,
  // senha, e então a falha conta ou o acerto apaga a contagem.
  async login(email: string, password: string): Promise<LoginResult> {
    const normalized = normalizeEmail(email);
    await this.loginAttempts.assertNotBlocked(normalized);
    const person = await this.people.verifyCredentials(normalized, password);
    if (!person) {
      await this.loginAttempts.recordFailure(normalized);
      throw new InvalidCredentialsError();
    }
    await this.loginAttempts.clear(normalized);

    const token = generateSessionToken();
    const now = new Date();
    await this.sessions.save(
      this.sessions.create({
        personId: person.id,
        tokenHash: hashSessionToken(token),
        expiresAt: this.expiresFrom(now),
        lastUsedAt: now,
      }),
    );
    return { token, person };
  }

  async authenticate(token: string | undefined): Promise<AuthenticatedSession> {
    if (!token) {
      throw new UnauthenticatedError();
    }
    const session = await this.sessions.findOne({
      where: { tokenHash: hashSessionToken(token) },
      relations: { person: true },
    });
    if (!session?.person) {
      throw new UnauthenticatedError();
    }
    const now = new Date();
    if (session.expiresAt <= now) {
      // A Sessão vencida é apagada quando apresentada (LLD, "Sessão e login").
      await this.sessions.delete({ id: session.id });
      throw new UnauthenticatedError();
    }
    await this.renewIfDue(session, now);
    return { sessionId: session.id, person: session.person };
  }

  // Sair apaga só a Sessão apresentada; as outras da mesma Pessoa continuam valendo.
  async logout(sessionId: string): Promise<void> {
    await this.sessions.delete({ id: sessionId });
  }

  // Revogar é apagar a linha; a próxima requisição com a Sessão recebe unauthenticated.
  async revokeAll(personId: string): Promise<number> {
    const result = await this.sessions.delete({ personId });
    return result.affected ?? 0;
  }

  async purgeExpired(): Promise<number> {
    const result = await this.sessions.delete({
      expiresAt: LessThanOrEqual(new Date()),
    });
    return result.affected ?? 0;
  }

  // UPDATE condicional: duas verificações ao mesmo tempo gravam no máximo uma renovação, e
  // antes do intervalo nada é gravado.
  private async renewIfDue(session: Session, now: Date): Promise<void> {
    const dueBefore = new Date(now.getTime() - RENEWAL_INTERVAL_MS);
    if (session.lastUsedAt > dueBefore) return;
    await this.sessions.update(
      { id: session.id, lastUsedAt: LessThanOrEqual(dueBefore) },
      { lastUsedAt: now, expiresAt: this.expiresFrom(now) },
    );
  }

  private expiresFrom(now: Date): Date {
    const ttlDays = this.config.get('SESSION_TTL_DAYS', { infer: true });
    return new Date(now.getTime() + ttlDays * DAY_MS);
  }
}
