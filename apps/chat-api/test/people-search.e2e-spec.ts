import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { authRoutes } from './support/auth-routes';
import { conversationRoutes } from './support/conversation-routes';
import { createTestApp } from './support/create-test-app';

type PeopleBody = { people: { id: string; name: string }[] };

describe('busca de Pessoas', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  // Uma Membro com um Canal privado só dela, e um sufixo que separa os nomes deste teste.
  async function privateChannel() {
    const owner = await authRoutes.loggedIn(app);
    const channelId = await conversationRoutes.privateChannelOf(
      app,
      owner.cookie,
    );
    return { owner, channelId, tag: randomUUID().slice(0, 8) };
  }

  function search(cookie: string, query: Record<string, string>) {
    return request(server).get('/v1/people').query(query).set('Cookie', cookie);
  }

  const names = (response: request.Response) =>
    (response.body as PeopleBody).people.map((person) => person.name);

  it('acha o nome sem diferenciar acentos e maiúsculas', async () => {
    const { owner, channelId, tag } = await privateChannel();
    await authRoutes.createPerson(app, { name: `Élida Rocha ${tag}` });
    await authRoutes.createPerson(app, { name: `Elias Prado ${tag}` });

    const [withoutAccent, withAccent] = await Promise.all([
      search(owner.cookie, {
        q: `ELIDA ROCHA ${tag}`,
        not_member_of: channelId,
      }),
      search(owner.cookie, {
        q: `élias prado ${tag}`,
        not_member_of: channelId,
      }),
    ]);

    expect(withoutAccent.status).toBe(200);
    expect(names(withoutAccent)).toEqual([`Élida Rocha ${tag}`]);
    expect(names(withAccent)).toEqual([`Elias Prado ${tag}`]);
  });

  it('trata %, _ e \\ como literais', async () => {
    const { owner, channelId, tag } = await privateChannel();
    await authRoutes.createPerson(app, { name: `Ana_100% ${tag}` });
    await authRoutes.createPerson(app, { name: `Ana X100Y ${tag}` });
    await authRoutes.createPerson(app, { name: `Barra \\ ${tag}` });

    const [percent, backslash] = await Promise.all([
      search(owner.cookie, { q: `_100%`, not_member_of: channelId }),
      search(owner.cookie, { q: `\\ ${tag}`, not_member_of: channelId }),
    ]);

    expect(names(percent).filter((name) => name.endsWith(tag))).toEqual([
      `Ana_100% ${tag}`,
    ]);
    expect(names(backslash)).toEqual([`Barra \\ ${tag}`]);
  });

  it('deixa de fora os Membros da Conversa', async () => {
    const { owner, channelId, tag } = await privateChannel();
    const member = await authRoutes.createPerson(app, {
      name: `Membro ${tag}`,
    });
    await conversationRoutes.addMembers(app, owner.cookie, channelId, [
      member.person.id,
    ]);
    await authRoutes.createPerson(app, { name: `Fora ${tag}` });

    const response = await search(owner.cookie, {
      q: tag,
      not_member_of: channelId,
    });

    expect(names(response)).toEqual([`Fora ${tag}`]);
  });

  it('devolve até 20 em ordem alfabética, inclusive sem texto', async () => {
    const { owner, channelId } = await privateChannel();

    const response = await search(owner.cookie, { not_member_of: channelId });

    expect(response.status).toBe(200);
    const listed = names(response);
    expect(listed).toHaveLength(20);
    const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
    expect(
      [...listed].sort(
        (a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0),
      ),
    ).toEqual(listed);
  });

  it('responde 404 para quem não é Membro', async () => {
    const { channelId } = await privateChannel();
    const other = await authRoutes.loggedIn(app);

    const response = await search(other.cookie, { not_member_of: channelId });

    expect(response.status).toBe(404);
    expect((response.body as { code: string }).code).toBe(
      'conversation_not_found',
    );
  });

  it('responde 400 sem not_member_of válido', async () => {
    const { owner } = await privateChannel();

    const responses = await Promise.all([
      search(owner.cookie, { q: 'a' }),
      search(owner.cookie, { not_member_of: 'abc' }),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(400);
      expect((response.body as { code: string }).code).toBe(
        'validation_failed',
      );
    }
  });
});
