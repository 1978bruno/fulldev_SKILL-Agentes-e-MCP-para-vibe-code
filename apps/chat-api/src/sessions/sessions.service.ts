import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Env } from '../config/env.schema';
import { PeopleService } from '../people/people.service';
import { Person } from '../people/person.entity';
import { InvalidCredentialsError } from './invalid-credentials.error';
import { Session } from './session.entity';
import { generateSessionToken, hashSessionToken } from './session-token';
import { UnauthenticatedError } from './unauthenticated.error';

const DAY_MS = 24 * 60 * 60 * 1000;

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

  async authenticate(token: string | undefined): Promise<Person> {
    if (!token) {
      throw new UnauthenticatedError();
    }
    const session = await this.sessions.findOne({
      where: { tokenHash: hashSessionToken(token) },
      relations: { person: true },
    });
    if (!session?.person || session.expiresAt <= new Date()) {
      throw new UnauthenticatedError();
    }
    return session.person;
  }

  private expiresFrom(now: Date): Date {
    const ttlDays = this.config.get('SESSION_TTL_DAYS', { infer: true });
    return new Date(now.getTime() + ttlDays * DAY_MS);
  }
}
