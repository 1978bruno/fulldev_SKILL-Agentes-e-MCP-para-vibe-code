import { INestApplication } from '@nestjs/common';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { personRoom, sessionRoom } from '../src/realtime/realtime-socket';
import { agingRoutes, minutesAgo } from './support/aging-routes';
import { authRoutes } from './support/auth-routes';
import {
  listenTestApp,
  realtimeRoutes,
  TestSocket,
} from './support/realtime-routes';

describe('conexão do WebSocket', () => {
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

  const loggedIn = () => authRoutes.loggedIn(app);

  async function connect(
    options: Parameters<typeof realtimeRoutes.connect>[1],
  ) {
    const result = await realtimeRoutes.connect(url, options);
    sockets.push(result.socket);
    return result;
  }

  it('aceita a conexão com Sessão válida e a origem da web', async () => {
    const { token } = await loggedIn();

    const { socket, error } = await connect({ token });

    expect(error).toBeUndefined();
    expect(socket.connected).toBe(true);
  });

  it('põe o socket nas salas da Pessoa e da Sessão', async () => {
    const { person, token } = await loggedIn();
    const { socket } = await connect({ token });
    const server = app.get(RealtimeGateway).server;

    const [inPersonRoom] = await server
      .in(personRoom(person.id))
      .fetchSockets();
    const [remote] = await server.in(socket.id!).fetchSockets();

    expect(inPersonRoom?.id).toBe(socket.id);
    expect(remote.rooms).toContain(sessionRoom(remote.data.sessionId));
  });

  it('recusa sem cookie com unauthenticated', async () => {
    const { error } = await connect({});

    expect(error?.message).toBe('unauthenticated');
  });

  it('recusa um token desconhecido com unauthenticated', async () => {
    const { error } = await connect({ token: 'token-que-nao-existe' });

    expect(error?.message).toBe('unauthenticated');
  });

  it('recusa a Sessão vencida com unauthenticated', async () => {
    const { token } = await loggedIn();
    await agingRoutes.ageSession(app, token, { expiresAt: minutesAgo(1) });

    const { error } = await connect({ token });

    expect(error?.message).toBe('unauthenticated');
  });

  it('recusa outra origem', async () => {
    const { token } = await loggedIn();

    const { socket, error } = await connect({
      token,
      origin: 'http://outro-site.example',
    });

    expect(error).toBeDefined();
    expect(socket.connected).toBe(false);
  });

  it('recusa o handshake sem origem', async () => {
    const { token } = await loggedIn();

    const { socket, error } = await connect({ token, origin: null });

    expect(error).toBeDefined();
    expect(socket.connected).toBe(false);
  });
});
