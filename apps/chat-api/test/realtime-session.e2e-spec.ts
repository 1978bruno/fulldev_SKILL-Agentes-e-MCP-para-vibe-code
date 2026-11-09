import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { hashSessionToken } from '../src/sessions/session-token';
import { agingRoutes, daysAgo, minutesAgo } from './support/aging-routes';
import { authRoutes } from './support/auth-routes';
import {
  collectEvents,
  listenTestApp,
  realtimeRoutes,
  settle,
  TestSocket,
  waitForCount,
} from './support/realtime-routes';

describe('Sessão no WebSocket', () => {
  let app: INestApplication;
  let url: string;
  const sockets: TestSocket[] = [];

  beforeAll(async () => {
    ({ app, url } = await listenTestApp());
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
  });

  afterAll(async () => {
    await app.close();
  });

  async function connected(token: string): Promise<TestSocket> {
    const socket = await realtimeRoutes.connected(url, { token });
    sockets.push(socket);
    return socket;
  }

  function disconnection(socket: TestSocket): Promise<string> {
    return new Promise((resolve) => socket.once('disconnect', resolve));
  }

  async function sessionDates(token: string) {
    const [row] = await app
      .get(DataSource)
      .query<{ last_used_at: Date; expires_at: Date }[]>(
        'SELECT last_used_at, expires_at FROM sessions WHERE token_hash = $1',
        [hashSessionToken(token)],
      );
    return row;
  }

  it('sair desconecta os sockets da Sessão, e só os dela', async () => {
    const { email, password } = await authRoutes.createPerson(app);
    const first = await authRoutes.login(app, email, password);
    const second = await authRoutes.login(app, email, password);
    const leaving = await connected(first);
    const staying = await connected(second);
    const ended = collectEvents(leaving, 'session.ended');
    const disconnected = disconnection(leaving);

    await request(app.getHttpServer() as App)
      .delete('/v1/sessions/current')
      .set('Cookie', authRoutes.sessionCookie(first))
      .expect(204);

    await waitForCount(ended, 1);
    expect(await disconnected).toBe('io server disconnect');
    await settle();
    expect(staying.connected).toBe(true);
  });

  it('a reconferência desconecta a Sessão revogada', async () => {
    const { person, token } = await authRoutes.loggedIn(app);
    const socket = await connected(token);
    const ended = collectEvents(socket, 'session.ended');
    const disconnected = disconnection(socket);
    await app
      .get(DataSource)
      .query('DELETE FROM sessions WHERE person_id = $1', [person.id]);

    await app.get(RealtimeGateway).recheckSessions();

    await waitForCount(ended, 1);
    expect(await disconnected).toBe('io server disconnect');
  });

  it('a reconferência desconecta a Sessão vencida', async () => {
    const { token } = await authRoutes.loggedIn(app);
    const socket = await connected(token);
    const ended = collectEvents(socket, 'session.ended');
    await agingRoutes.ageSession(app, token, { expiresAt: minutesAgo(1) });

    await app.get(RealtimeGateway).recheckSessions();

    await waitForCount(ended, 1);
  });

  it('a reconferência renova a Sessão que vale', async () => {
    const { token } = await authRoutes.loggedIn(app);
    const socket = await connected(token);
    await agingRoutes.ageSession(app, token, { lastUsedAt: daysAgo(2) });
    const before = await sessionDates(token);

    await app.get(RealtimeGateway).recheckSessions();

    const after = await sessionDates(token);
    expect(after.last_used_at.getTime()).toBeGreaterThan(
      before.last_used_at.getTime(),
    );
    expect(after.expires_at.getTime()).toBeGreaterThan(
      before.expires_at.getTime(),
    );
    expect(socket.connected).toBe(true);
  });
});
