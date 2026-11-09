import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { authRoutes } from './support/auth-routes';
import { conversationRoutes } from './support/conversation-routes';
import { createTestApp } from './support/create-test-app';
import { uniqueChannelName } from './support/unique-channel-name';

type ConversationBody = {
  id: string;
  kind: string;
  name: string;
  topic: string | null;
  member_count: number;
};

describe('criar Canal', () => {
  let app: INestApplication;
  let server: App;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer() as App;
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  const loggedIn = () => authRoutes.loggedIn(app);

  function create(cookie: string, body: Record<string, unknown>) {
    return request(server)
      .post('/v1/conversations')
      .set('Cookie', cookie)
      .send(body);
  }

  async function rowsNamed(name: string) {
    return dataSource.query<{ id: string; created_by: string | null }[]>(
      'SELECT id, created_by FROM conversations WHERE name = $1',
      [name],
    );
  }

  it('cria o Canal público com todas as Pessoas como Membros', async () => {
    const { person, cookie } = await loggedIn();
    const other = await authRoutes.createPerson(app);
    const name = uniqueChannelName();

    const response = await create(cookie, {
      kind: 'public_channel',
      name,
      topic: 'Planejamento do trimestre',
      client_id: randomUUID(),
    });

    expect(response.status).toBe(201);
    const { conversation } = response.body as {
      conversation: ConversationBody;
    };
    expect(conversation).toMatchObject({
      kind: 'public_channel',
      name,
      topic: 'Planejamento do trimestre',
    });
    const [row] = await rowsNamed(name);
    expect(row).toEqual({ id: conversation.id, created_by: person.id });
    const members = await dataSource.query<{ person_id: string }[]>(
      'SELECT person_id FROM conversation_members WHERE conversation_id = $1',
      [conversation.id],
    );
    const memberIds = members.map((member) => member.person_id);
    expect(memberIds).toEqual(
      expect.arrayContaining([person.id, other.person.id]),
    );
    expect(conversation.member_count).toBe(memberIds.length);
  });

  it('o reenvio com o mesmo client_id devolve o mesmo Canal, mesmo com outro nome', async () => {
    const { cookie } = await loggedIn();
    const clientId = randomUUID();
    const name = uniqueChannelName();
    const first = await create(cookie, {
      kind: 'public_channel',
      name,
      client_id: clientId,
    });
    const otherName = uniqueChannelName();

    const response = await create(cookie, {
      kind: 'public_channel',
      name: otherName,
      client_id: clientId,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(first.body);
    expect(await rowsNamed(name)).toHaveLength(1);
    expect(await rowsNamed(otherName)).toHaveLength(0);
  });

  it('o mesmo client_id de outra Pessoa cria outro Canal', async () => {
    const ana = await loggedIn();
    const bruno = await loggedIn();
    const clientId = randomUUID();
    await create(ana.cookie, {
      kind: 'public_channel',
      name: uniqueChannelName(),
      client_id: clientId,
    });
    const name = uniqueChannelName();

    const response = await create(bruno.cookie, {
      kind: 'public_channel',
      name,
      client_id: clientId,
    });

    expect(response.status).toBe(201);
    expect(
      (response.body as { conversation: ConversationBody }).conversation,
    ).toMatchObject({ name });
  });

  it('nome repetido responde 409 com o nome no detail', async () => {
    const { cookie } = await loggedIn();
    const existing = await conversationRoutes.createChannel(app);

    const response = await create(cookie, {
      kind: 'public_channel',
      name: `  ${existing.name!}  `,
      client_id: randomUUID(),
    });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      code: 'channel_name_taken',
      detail: `Já existe um canal chamado #${existing.name!}.`,
    });
  });

  it.each([
    ['nome com maiúscula', { name: 'Planejamento' }],
    ['nome com espaço', { name: 'planejamento q4' }],
    ['nome vazio', { name: '' }],
    ['nome com 81 caracteres', { name: 'a'.repeat(81) }],
    ['nome ausente', { name: undefined }],
    ['Tópico com quebra de linha', { topic: 'linha 1\nlinha 2' }],
    ['Tópico com 251 caracteres', { topic: 'a'.repeat(251) }],
    ['kind desconhecido', { kind: 'direct' }],
    ['client_id que não é uuid', { client_id: 'abc' }],
  ])('%s responde 400', async (_case, override) => {
    const { cookie } = await loggedIn();

    const response = await create(cookie, {
      kind: 'public_channel',
      name: uniqueChannelName(),
      client_id: randomUUID(),
      ...override,
    });

    expect(response.status).toBe(400);
    expect((response.body as { code: string }).code).toBe('validation_failed');
  });

  it('cria o Canal privado só com quem o criou', async () => {
    const { person, cookie } = await loggedIn();
    await authRoutes.createPerson(app);
    const name = uniqueChannelName();

    const response = await create(cookie, {
      kind: 'private_channel',
      name,
      client_id: randomUUID(),
    });

    expect(response.status).toBe(201);
    const { conversation } = response.body as {
      conversation: ConversationBody;
    };
    expect(conversation).toMatchObject({
      kind: 'private_channel',
      name,
      member_count: 1,
    });
    const members = await dataSource.query<{ person_id: string }[]>(
      'SELECT person_id FROM conversation_members WHERE conversation_id = $1',
      [conversation.id],
    );
    expect(members).toEqual([{ person_id: person.id }]);
  });

  it('o reenvio do Canal privado devolve o mesmo Canal', async () => {
    const { cookie } = await loggedIn();
    const body = {
      kind: 'private_channel',
      name: uniqueChannelName(),
      client_id: randomUUID(),
    };
    const first = await create(cookie, body);

    const response = await create(cookie, body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(first.body);
  });

  it('o nome de um Canal privado de que a Pessoa não é Membro responde 409', async () => {
    const owner = await loggedIn();
    const name = uniqueChannelName();
    await create(owner.cookie, {
      kind: 'private_channel',
      name,
      client_id: randomUUID(),
    });
    const { cookie } = await loggedIn();

    const response = await create(cookie, {
      kind: 'public_channel',
      name,
      client_id: randomUUID(),
    });

    expect(response.status).toBe(409);
    expect((response.body as { code: string }).code).toBe('channel_name_taken');
  });

  it('o Canal privado com o nome de um público responde 409', async () => {
    const { cookie } = await loggedIn();
    const existing = await conversationRoutes.createChannel(app);

    const response = await create(cookie, {
      kind: 'private_channel',
      name: existing.name,
      client_id: randomUUID(),
    });

    expect(response.status).toBe(409);
  });

  it('quem não é Membro não vê o Canal privado em lista nem rota', async () => {
    const owner = await loggedIn();
    const created = await create(owner.cookie, {
      kind: 'private_channel',
      name: uniqueChannelName(),
      client_id: randomUUID(),
    });
    const { id } = (created.body as { conversation: ConversationBody })
      .conversation;
    const { cookie } = await loggedIn();

    const responses = await Promise.all([
      request(server).get(`/v1/conversations/${id}`).set('Cookie', cookie),
      request(server)
        .get(`/v1/conversations/${id}/messages`)
        .set('Cookie', cookie),
      request(server)
        .post(`/v1/conversations/${id}/messages`)
        .set('Cookie', cookie)
        .send({ client_id: randomUUID(), body: 'Oi' }),
      request(server).get('/v1/conversations').set('Cookie', cookie),
    ]);

    for (const response of responses.slice(0, 3)) {
      expect(response.status).toBe(404);
      expect((response.body as { code: string }).code).toBe(
        'conversation_not_found',
      );
    }
    const listed = (
      responses[3].body as { conversations: ConversationBody[] }
    ).conversations.map((conversation) => conversation.id);
    expect(listed).not.toContain(id);
  });

  it('o banco recusa Canal privado sem nome', async () => {
    const insert = dataSource.query(
      "INSERT INTO conversations (id, kind) VALUES (gen_random_uuid(), 'private_channel')",
    );

    await expect(insert).rejects.toThrow(/conversations_channel_name_check/);
  });

  it('responde 401 sem Sessão', async () => {
    const response = await request(server).post('/v1/conversations').send({
      kind: 'public_channel',
      name: uniqueChannelName(),
      client_id: randomUUID(),
    });

    expect(response.status).toBe(401);
    expect((response.body as { code: string }).code).toBe('unauthenticated');
  });
});
