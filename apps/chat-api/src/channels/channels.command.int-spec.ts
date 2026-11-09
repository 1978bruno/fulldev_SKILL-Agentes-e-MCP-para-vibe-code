import { INestApplicationContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { uniqueChannelName } from '../../test/support/unique-channel-name';
import { uniqueEmail } from '../../test/support/unique-email';
import { CommandOutput } from '../common/cli/command';
import { ConversationsService } from '../conversations/conversations.service';
import { PeopleService } from '../people/people.service';
import { ChannelsCommand } from './channels.command';
import { ChannelsModule } from './channels.module';

function recordingOutput(): CommandOutput & { errors: string[] } {
  const errors: string[] = [];
  return { errors, info: () => undefined, error: (m) => errors.push(m) };
}

describe('comando de canais', () => {
  let context: INestApplicationContext;
  let dataSource: DataSource;
  let cls: ClsService;
  let conversations: ConversationsService;
  let people: PeopleService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ChannelsModule],
    }).compile();
    context = await moduleRef.init();
    dataSource = context.get(DataSource);
    cls = context.get(ClsService);
    conversations = context.get(ConversationsService);
    people = context.get(PeopleService);
  });

  afterAll(async () => {
    await context.close();
  });

  // Como o cli.ts: cada execução do comando roda dentro de um contexto do CLS.
  function run(args: string[], output = recordingOutput()) {
    const command = new ChannelsCommand(conversations, output);
    return cls.run(() => command.run(args));
  }

  async function channelsNamed(name: string) {
    return dataSource.query<
      { id: string; kind: string; topic: string | null }[]
    >('SELECT id, kind, topic FROM conversations WHERE name = $1', [name]);
  }

  it('create grava o Canal com todas as Pessoas como Membros', async () => {
    const person = await people.create({
      email: uniqueEmail(),
      name: 'Ana Souza',
      password: 'senha',
    });
    const name = uniqueChannelName();

    const exitCode = await run(['create', name, 'Conversas do time']);

    expect(exitCode).toBe(0);
    const [channel] = await channelsNamed(name);
    expect(channel).toMatchObject({
      kind: 'public_channel',
      topic: 'Conversas do time',
    });
    // Outras suítes criam Pessoas ao mesmo tempo: conta só as que existiam antes do Canal.
    const [{ outside }] = await dataSource.query<{ outside: string }[]>(
      `SELECT count(*) AS outside FROM people p
       WHERE p.created_at <= (SELECT created_at FROM conversations WHERE id = $1)
         AND NOT EXISTS (SELECT 1 FROM conversation_members m
                         WHERE m.conversation_id = $1 AND m.person_id = p.id)`,
      [channel.id],
    );
    expect(Number(outside)).toBe(0);
    const [membership] = await dataSource.query<unknown[]>(
      'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND person_id = $2',
      [channel.id, person.id],
    );
    expect(membership).toBeDefined();
  });

  it('create recusa nome repetido', async () => {
    const name = uniqueChannelName();
    await run(['create', name]);
    const output = recordingOutput();

    const exitCode = await run(['create', name, 'Outro tópico'], output);

    expect(exitCode).toBe(1);
    expect(output.errors).toEqual([`Já existe um canal com o nome ${name}.`]);
    expect(await channelsNamed(name)).toHaveLength(1);
  });

  it.each([
    ['com maiúsculas', 'Geral-X'],
    ['com espaço', 'time de produto'],
    ['com #', '#geral'],
  ])('create recusa nome %s', async (_caso, name) => {
    const output = recordingOutput();

    const exitCode = await run(['create', name], output);

    expect(exitCode).toBe(1);
    expect(output.errors).toHaveLength(1);
    expect(await channelsNamed(name)).toHaveLength(0);
  });

  it('create recusa um Tópico partido em vários argumentos, sem gravar o Canal', async () => {
    const name = uniqueChannelName();
    const output = recordingOutput();

    const exitCode = await run(
      ['create', name, 'Canal', 'da', 'empresa'],
      output,
    );

    expect(exitCode).toBe(1);
    expect(output.errors).toEqual([
      'Uso: pnpm channels create <nome> ["<tópico>"]',
    ]);
    expect(await channelsNamed(name)).toHaveLength(0);
  });

  it('create recusa Tópico com quebra de linha, sem gravar o Canal', async () => {
    const name = uniqueChannelName();
    const output = recordingOutput();

    const exitCode = await run(
      ['create', name, 'linha um\nlinha dois'],
      output,
    );

    expect(exitCode).toBe(1);
    expect(output.errors).toEqual(['O tópico precisa caber numa linha só.']);
    expect(await channelsNamed(name)).toHaveLength(0);
  });

  it('set-topic troca o Tópico e, com "", o apaga', async () => {
    const name = uniqueChannelName();
    await run(['create', name, 'Tópico antigo']);

    expect(await run(['set-topic', name, '  Tópico novo  '])).toBe(0);
    expect((await channelsNamed(name))[0].topic).toBe('Tópico novo');

    expect(await run(['set-topic', name, ''])).toBe(0);
    expect((await channelsNamed(name))[0].topic).toBeNull();
  });

  it('set-topic recusa um Canal que não existe', async () => {
    const name = uniqueChannelName();
    const output = recordingOutput();

    const exitCode = await run(['set-topic', name, 'Tópico'], output);

    expect(exitCode).toBe(1);
    expect(output.errors).toEqual([`Canal não encontrado: ${name}.`]);
  });

  it('set-topic recusa Tópico com quebra de linha, sem gravar', async () => {
    const name = uniqueChannelName();
    await run(['create', name, 'Tópico antigo']);
    const output = recordingOutput();

    const exitCode = await run(['set-topic', name, 'um\ndois'], output);

    expect(exitCode).toBe(1);
    expect(output.errors).toEqual(['O tópico precisa caber numa linha só.']);
    expect((await channelsNamed(name))[0].topic).toBe('Tópico antigo');
  });

  it('set-topic sem o Tópico mostra o uso', async () => {
    const output = recordingOutput();

    const exitCode = await run(['set-topic', uniqueChannelName()], output);

    expect(exitCode).toBe(1);
    expect(output.errors).toEqual([
      'Uso: pnpm channels set-topic <nome> "<tópico>"',
    ]);
  });

  it('list mostra os Canais em ordem, com o número de Membros e o Tópico', async () => {
    const prefix = uniqueChannelName();
    await people.create({
      email: uniqueEmail(),
      name: 'Ana Souza',
      password: 'senha',
    });
    await run(['create', `${prefix}-b`]);
    await run(['create', `${prefix}-a`, 'Avisos do time']);
    const lines: string[] = [];
    const output = { ...recordingOutput(), info: (m: string) => lines.push(m) };

    const exitCode = await run(['list'], output);

    expect(exitCode).toBe(0);
    // Outras suítes criam contas ao mesmo tempo, e elas entram nos Canais: o número de Membros
    // só é conferido no formato.
    const mine = lines.filter((line) => line.startsWith(`#${prefix}-`));
    expect(mine).toHaveLength(2);
    expect(mine[0]).toMatch(
      new RegExp(`^#${prefix}-a \\(\\d+ Membros?\\) Avisos do time$`),
    );
    expect(mine[1]).toMatch(new RegExp(`^#${prefix}-b \\(\\d+ Membros?\\)$`));
  });
});
