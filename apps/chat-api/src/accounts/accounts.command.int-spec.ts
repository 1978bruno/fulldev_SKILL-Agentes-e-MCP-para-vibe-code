import { INestApplicationContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { verify } from '@node-rs/argon2';
import { DataSource } from 'typeorm';
import { uniqueEmail } from '../../test/support/unique-email';
import { PeopleService } from '../people/people.service';
import { SessionsService } from '../sessions/sessions.service';
import { AccountsCommand, CommandOutput } from './accounts.command';
import { AccountsModule } from './accounts.module';

function givenPassword(password: string) {
  return { ask: () => Promise.resolve(password) };
}

function recordingOutput(): CommandOutput & { errors: string[] } {
  const errors: string[] = [];
  return { errors, info: () => undefined, error: (m) => errors.push(m) };
}

describe('comando de contas', () => {
  let context: INestApplicationContext;
  let people: PeopleService;
  let sessions: SessionsService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AccountsModule],
    }).compile();
    context = await moduleRef.init();
    people = context.get(PeopleService);
    sessions = context.get(SessionsService);
    dataSource = context.get(DataSource);
  });

  afterAll(async () => {
    await context.close();
  });

  function command(password = 'senha-do-terminal', output = recordingOutput()) {
    return new AccountsCommand(
      people,
      sessions,
      givenPassword(password),
      output,
    );
  }

  async function personWithSessions(count: number) {
    const email = uniqueEmail();
    const person = await people.create({
      email,
      name: 'Ana Souza',
      password: 'senha-antiga',
    });
    for (let i = 0; i < count; i += 1)
      await sessions.login(email, 'senha-antiga');
    return person;
  }

  async function sessionCount(personId: string): Promise<number> {
    const [{ count }] = await dataSource.query<{ count: string }[]>(
      'SELECT count(*) FROM sessions WHERE person_id = $1',
      [personId],
    );
    return Number(count);
  }

  describe('create', () => {
    it('cria a Pessoa com o e-mail normalizado e a senha em Argon2id', async () => {
      const email = uniqueEmail();

      const exitCode = await command().run([
        'create',
        `  ${email.toUpperCase()} `,
        'Ana Souza',
      ]);

      expect(exitCode).toBe(0);
      const person = await people.findByEmail(email);
      expect(person).toMatchObject({ email, name: 'Ana Souza' });
      expect(person?.passwordHash.startsWith('$argon2id$')).toBe(true);
      expect(await verify(person!.passwordHash, 'senha-do-terminal')).toBe(
        true,
      );
    });

    it('recusa um e-mail que já existe', async () => {
      const email = uniqueEmail();
      await people.create({ email, name: 'Ana Souza', password: 'senha-1' });
      const output = recordingOutput();

      const exitCode = await command('senha-2', output).run([
        'create',
        email,
        'Outra Ana',
      ]);

      expect(exitCode).toBe(1);
      expect(output.errors.join('\n')).toContain('Já existe');
      expect(await people.findByEmail(email)).toMatchObject({
        name: 'Ana Souza',
      });
    });
  });

  describe('revoke-sessions', () => {
    it('apaga todas as Sessões da Pessoa', async () => {
      const person = await personWithSessions(2);

      const exitCode = await command().run(['revoke-sessions', person.email]);

      expect(exitCode).toBe(0);
      expect(await sessionCount(person.id)).toBe(0);
    });

    it('recusa operação com e-mail sem conta', async () => {
      const output = recordingOutput();

      const exitCode = await command('x', output).run([
        'revoke-sessions',
        uniqueEmail(),
      ]);

      expect(exitCode).toBe(1);
      expect(output.errors.join('\n')).toContain('Nenhuma Pessoa');
    });
  });

  describe('reset-password', () => {
    it('troca a senha e revoga todas as Sessões', async () => {
      const person = await personWithSessions(1);

      const exitCode = await command('senha-nova').run([
        'reset-password',
        person.email,
      ]);

      expect(exitCode).toBe(0);
      const updated = await people.findByEmail(person.email);
      expect(await verify(updated!.passwordHash, 'senha-nova')).toBe(true);
      expect(await verify(updated!.passwordHash, 'senha-antiga')).toBe(false);
      expect(await sessionCount(person.id)).toBe(0);
    });

    it('recusa operação com e-mail sem conta', async () => {
      const output = recordingOutput();

      const exitCode = await command('x', output).run([
        'reset-password',
        uniqueEmail(),
      ]);

      expect(exitCode).toBe(1);
      expect(output.errors.join('\n')).toContain('Nenhuma Pessoa');
    });
  });

  describe('purge-expired-sessions', () => {
    it('apaga só as Sessões vencidas', async () => {
      const person = await personWithSessions(2);
      await dataSource.query(
        `UPDATE sessions SET expires_at = now() - interval '1 day'
         WHERE id = (SELECT id FROM sessions WHERE person_id = $1 ORDER BY id LIMIT 1)`,
        [person.id],
      );

      const exitCode = await command().run(['purge-expired-sessions']);

      expect(exitCode).toBe(0);
      expect(await sessionCount(person.id)).toBe(1);
    });
  });
});
