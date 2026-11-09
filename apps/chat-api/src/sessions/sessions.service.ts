import { randomUUIDv7 } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { Env } from '../config/env.schema';
import { PeopleService } from '../people/people.service';
import { Person } from '../people/person.entity';
import { InvalidCredentialsError } from './invalid-credentials.error';
import { RENEWAL_INTERVAL_DAYS } from './session-renewal';
import { Session } from './session.entity';
import { generateSessionToken, hashSessionToken } from './session-token';
import { UnauthenticatedError } from './unauthenticated.error';

const DAY_MS = 24 * 60 * 60 * 1000;

const RENEWAL_INTERVAL_MS = RENEWAL_INTERVAL_DAYS * DAY_MS;

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
    private readonly config: ConfigService<Env, true>,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const person = await this.people.verifyCredentials(email, password);
    if (!person) {
      throw new InvalidCredentialsError();
    }
    return this.startSession(person);
  }

  // Cria a Sessão só se o hash da senha ainda for o que o login conferiu. O FOR SHARE trava a
  // linha da Pessoa: um reset-password que troca a senha ao mesmo tempo faz esta inserção esperar
  // e reavaliar o hash (e não inserir), e a troca que começa depois espera a inserção terminar,
  // para a revogação que vem em seguida apagar a Sessão.
  async startSession(person: Person): Promise<LoginResult> {
    const token = generateSessionToken();
    const now = new Date();
    const inserted = await this.sessions.query<{ id: string }[]>(
      `INSERT INTO sessions (id, person_id, token_hash, expires_at, last_used_at)
       SELECT $1, id, $2, $3, $4 FROM people WHERE id = $5 AND password_hash = $6
       FOR SHARE
       RETURNING id`,
      [
        randomUUIDv7(),
        hashSessionToken(token),
        this.expiresFrom(now),
        now,
        person.id,
        person.passwordHash,
      ],
    );
    if (inserted.length === 0) {
      throw new InvalidCredentialsError();
    }
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
      // A Sessão vencida é apagada quando apresentada (LLD, "Sessão e login"). A condição de
      // vencimento no DELETE preserva uma renovação concorrente de outra requisição.
      const deleted = await this.sessions.delete({
        id: session.id,
        expiresAt: LessThanOrEqual(now),
      });
      if (
        deleted.affected === 0 &&
        (await this.isStillValid(session.id, now))
      ) {
        return { sessionId: session.id, person: session.person };
      }
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

  private async isStillValid(sessionId: string, now: Date): Promise<boolean> {
    return this.sessions.exists({
      where: { id: sessionId, expiresAt: MoreThan(now) },
    });
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
