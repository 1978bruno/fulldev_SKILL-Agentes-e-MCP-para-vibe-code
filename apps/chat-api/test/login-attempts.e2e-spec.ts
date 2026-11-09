import { INestApplication, Logger } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { agingRoutes, minutesAgo } from './support/aging-routes';
import { authRoutes } from './support/auth-routes';
import { createTestApp } from './support/create-test-app';
import { uniqueEmail } from './support/unique-email';

describe('limite de tentativas de login', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  function attempt(email: string, password: string) {
    return request(server).post('/v1/sessions').send({ email, password });
  }

  async function failTimes(email: string, times: number): Promise<number[]> {
    const statuses: number[] = [];
    for (let i = 0; i < times; i += 1) {
      statuses.push((await attempt(email, 'senha-errada')).status);
    }
    return statuses;
  }

  async function attemptsRow(email: string) {
    const rows = await app
      .get(DataSource)
      .query<{ failed_count: number; blocked_until: Date | null }[]>(
        'SELECT failed_count, blocked_until FROM login_attempts WHERE email = $1',
        [email],
      );
    return rows[0];
  }

  it('a 5ª falha bloqueia, e até a senha certa recebe 429 com Retry-After', async () => {
    const { email, password } = await authRoutes.createPerson(app);
    const statuses = await failTimes(email, 5);

    const response = await attempt(email, password);

    expect(statuses).toEqual([401, 401, 401, 401, 401]);
    expect(response.status).toBe(429);
    expect(response.body).toMatchObject({ code: 'too_many_login_attempts' });
    const retryAfter = Number(response.headers['retry-after']);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(900);
  });

  it('conta as falhas de e-mail sem conta', async () => {
    const email = uniqueEmail();
    await failTimes(email, 5);

    const response = await attempt(email, 'qualquer-senha');

    expect(response.status).toBe(429);
  });

  it('não conta a entrada inválida', async () => {
    const email = uniqueEmail();
    for (let i = 0; i < 5; i += 1) await attempt(email, '');

    const response = await attempt(email, '');

    expect(response.status).toBe(400);
    expect(await attemptsRow(email)).toBeUndefined();
  });

  it('recomeça a contagem quando a janela venceu', async () => {
    const email = uniqueEmail();
    await failTimes(email, 4);
    await agingRoutes.ageLoginAttempts(app, email, {
      firstFailedAt: minutesAgo(16),
    });

    const response = await attempt(email, 'senha-errada');

    expect(response.status).toBe(401);
    expect(await attemptsRow(email)).toMatchObject({
      failed_count: 1,
      blocked_until: null,
    });
  });

  it('as tentativas durante o bloqueio não contam nem o estendem', async () => {
    const email = uniqueEmail();
    await failTimes(email, 5);
    const before = await attemptsRow(email);

    const statuses = await failTimes(email, 3);

    expect(statuses).toEqual([429, 429, 429]);
    expect(await attemptsRow(email)).toEqual(before);
  });

  it('registra um warn sem o e-mail completo nem a senha a cada tentativa bloqueada', async () => {
    const email = uniqueEmail();
    await failTimes(email, 5);
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    await attempt(email, 'senha-certa-ou-nao');

    const messages = warn.mock.calls.map((call) => JSON.stringify(call));
    warn.mockRestore();
    expect(messages).toHaveLength(1);
    expect(messages[0]).not.toContain(email);
    expect(messages[0]).not.toContain('senha-certa-ou-nao');
  });

  it('passado o bloqueio, a senha certa entra', async () => {
    const { email, password } = await authRoutes.createPerson(app);
    await failTimes(email, 5);
    await agingRoutes.ageLoginAttempts(app, email, {
      firstFailedAt: minutesAgo(31),
      blockedUntil: minutesAgo(1),
    });

    const response = await attempt(email, password);

    expect(response.status).toBe(201);
  });

  it('um login certo antes do limite apaga a contagem', async () => {
    const { email, password } = await authRoutes.createPerson(app);
    await failTimes(email, 4);

    const response = await attempt(email, password);

    expect(response.status).toBe(201);
    expect(await attemptsRow(email)).toBeUndefined();
  });

  it('duas falhas simultâneas contam as duas', async () => {
    const email = uniqueEmail();

    await Promise.all([attempt(email, 'errada-1'), attempt(email, 'errada-2')]);

    expect(await attemptsRow(email)).toMatchObject({ failed_count: 2 });
  });
});
