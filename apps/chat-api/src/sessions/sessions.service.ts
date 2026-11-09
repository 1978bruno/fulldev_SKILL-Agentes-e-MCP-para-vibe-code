import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { Env } from '../config/env.schema';
import { RENEWAL_INTERVAL_DAYS } from '../config/session-values';
import { LoginAttemptsService } from '../login-attempts/login-attempts.service';
import { normalizeEmail } from '../people/normalize-email';
import { PeopleService } from '../people/people.service';
import { Person } from '../people/person.entity';
import { InvalidCredentialsError } from './invalid-credentials.error';
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
    // A Sessão vem antes de apagar a contagem: um login recusado porque a senha mudou enquanto
    // ele conferia conta como falha e não zera as tentativas.
    let result: LoginResult;
    try {
      result = await this.startSession(person);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        await this.loginAttempts.recordFailure(normalized);
      }
      throw error;
    }
    await this.loginAttempts.clear(normalized);
    return result;
  }

  // Cria a Sessão só se o hash da senha ainda for o que o login conferiu: um reset-password ao
  // mesmo tempo não deixa uma Sessão aberta com a senha antiga.
  async startSession(person: Person): Promise<LoginResult> {
    const token = generateSessionToken();
    const now = new Date();
    const created = await this.people.withPasswordUnchanged(
      person,
      (manager) => {
        const sessions = manager.getRepository(Session);
        return sessions.save(
          sessions.create({
            personId: person.id,
            tokenHash: hashSessionToken(token),
            expiresAt: this.expiresFrom(now),
            lastUsedAt: now,
          }),
        );
      },
    );
    if (!created) {
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
  // Com `manager`, roda dentro da transação de quem chama (a troca de senha).
  async revokeAll(
    personId: string,
    manager: EntityManager = this.sessions.manager,
  ): Promise<number> {
    const result = await manager.delete(Session, { personId });
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
    // Só renova uma Sessão que ainda não venceu: a condição no UPDATE impede que uma Sessão
    // vencida entre a leitura e a escrita ganhe mais uma duração inteira.
    await this.sessions.update(
      {
        id: session.id,
        lastUsedAt: LessThanOrEqual(dueBefore),
        expiresAt: MoreThan(now),
      },
      { lastUsedAt: now, expiresAt: this.expiresFrom(now) },
    );
  }

  private expiresFrom(now: Date): Date {
    const ttlDays = this.config.get('SESSION_TTL_DAYS', { infer: true });
    return new Date(now.getTime() + ttlDays * DAY_MS);
  }
}
