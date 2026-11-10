import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { authRoutes } from './support/auth-routes';
import { conversationRoutes } from './support/conversation-routes';
import { createTestApp } from './support/create-test-app';

type AddBody = { added_person_ids: string[]; member_count: number };

describe('adicionar ao Canal privado', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function privateChannel() {
    const owner = await authRoutes.loggedIn(app);
    const created = await conversationRoutes.createChannelByRest(
      app,
      owner.cookie,
      { kind: 'private_channel' },
    );
    const { id } = (created.body as { conversation: { id: string } })
      .conversation;
    return { owner, channelId: id };
  }

  const add = (cookie: string, channelId: string, personIds: unknown) =>
    request(app.getHttpServer() as App)
      .post(`/v1/conversations/${channelId}/members`)
      .set('Cookie', cookie)
      .send({ person_ids: personIds });

  async function memberIds(channelId: string): Promise<string[]> {
    const rows = await app
      .get(DataSource)
      .query<{ person_id: string }[]>(
        'SELECT person_id FROM conversation_members WHERE conversation_id = $1',
        [channelId],
      );
    return rows.map((row) => row.person_id);
  }

  it('as Pessoas viram Membros, com a quantidade de Membros', async () => {
    const { owner, channelId } = await privateChannel();
    const ana = await authRoutes.createPerson(app);
    const bruno = await authRoutes.createPerson(app);

    const response = await add(owner.cookie, channelId, [
      ana.person.id,
      bruno.person.id,
    ]);

    expect(response.status).toBe(200);
    const body = response.body as AddBody;
    expect(body.member_count).toBe(3);
    expect([...body.added_person_ids].sort()).toEqual(
      [ana.person.id, bruno.person.id].sort(),
    );
    expect(await memberIds(channelId)).toEqual(
      expect.arrayContaining([owner.person.id, ana.person.id, bruno.person.id]),
    );
  });

  it('quem já é Membro fica fora de added_person_ids', async () => {
    const { owner, channelId } = await privateChannel();
    const ana = await authRoutes.createPerson(app);
    await add(owner.cookie, channelId, [ana.person.id]);
    const bruno = await authRoutes.createPerson(app);

    const response = await add(owner.cookie, channelId, [
      ana.person.id,
      bruno.person.id,
    ]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      added_person_ids: [bruno.person.id],
      member_count: 3,
    });
  });

  it('um Canal público responde 409', async () => {
    const { cookie } = await authRoutes.loggedIn(app);
    const channel = await conversationRoutes.createChannel(app);
    const ana = await authRoutes.createPerson(app);

    const response = await add(cookie, channel.id, [ana.person.id]);

    expect(response.status).toBe(409);
    expect((response.body as { code: string }).code).toBe(
      'members_not_editable',
    );
  });

  it('quem não é Membro do Canal privado recebe 404', async () => {
    const { channelId } = await privateChannel();
    const other = await authRoutes.loggedIn(app);

    const response = await add(other.cookie, channelId, [other.person.id]);

    expect(response.status).toBe(404);
    expect(await memberIds(channelId)).not.toContain(other.person.id);
  });

  it.each([
    ['vazio', () => []],
    ['repetido', (id: string) => [id, id]],
    ['com 101 ids', () => Array.from({ length: 101 }, () => randomUUID())],
    ['com um id que não é de Pessoa', () => [randomUUID()]],
    ['com um texto que não é uuid', () => ['abc']],
  ])('person_ids %s responde 400', async (_case, build) => {
    const { owner, channelId } = await privateChannel();
    const ana = await authRoutes.createPerson(app);

    const response = await add(owner.cookie, channelId, build(ana.person.id));

    expect(response.status).toBe(400);
    expect((response.body as { code: string }).code).toBe('validation_failed');
  });

  it('responde 401 sem Sessão', async () => {
    const response = await request(app.getHttpServer() as App)
      .post(`/v1/conversations/${randomUUID()}/members`)
      .send({ person_ids: [randomUUID()] });

    expect(response.status).toBe(401);
  });
});
