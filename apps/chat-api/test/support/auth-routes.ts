import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PeopleService } from '../../src/people/people.service';
import { Person } from '../../src/people/person.entity';
import { uniqueEmail } from './unique-email';

export const TEST_PASSWORD = 'senha-correta-123';
export const SESSION_COOKIE_NAME = 'fc_session';

export interface CreatedPerson {
  person: Person;
  email: string;
  password: string;
}

// Atalhos da base de testes: preparar Pessoa e Sessão no Arrange, sem asserção.
export const authRoutes = {
  async createPerson(
    app: INestApplication,
    overrides: { email?: string; name?: string; password?: string } = {},
  ): Promise<CreatedPerson> {
    const email = overrides.email ?? uniqueEmail();
    const password = overrides.password ?? TEST_PASSWORD;
    const person = await app.get(PeopleService).create({
      email,
      name: overrides.name ?? 'Ana Souza',
      password,
    });
    return { person, email, password };
  },

  async login(
    app: INestApplication,
    email: string,
    password: string,
  ): Promise<string> {
    const response = await request(app.getHttpServer() as App)
      .post('/v1/sessions')
      .send({ email, password })
      .expect(201);
    return (response.body as { token: string }).token;
  },

  sessionCookie(token: string): string {
    return `${SESSION_COOKIE_NAME}=${token}`;
  },
};
