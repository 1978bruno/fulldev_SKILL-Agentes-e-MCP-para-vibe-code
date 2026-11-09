import { INestApplicationContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { verify } from '@node-rs/argon2';
import { uniqueEmail } from '../../test/support/unique-email';
import { PeopleService } from '../people/people.service';
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AccountsModule],
    }).compile();
    context = await moduleRef.init();
    people = context.get(PeopleService);
  });

  afterAll(async () => {
    await context.close();
  });

  describe('create', () => {
    it('cria a Pessoa com o e-mail normalizado e a senha em Argon2id', async () => {
      const email = uniqueEmail();
      const command = new AccountsCommand(
        people,
        givenPassword('senha-do-terminal'),
        recordingOutput(),
      );

      const exitCode = await command.run([
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
      const command = new AccountsCommand(
        people,
        givenPassword('senha-2'),
        output,
      );

      const exitCode = await command.run(['create', email, 'Outra Ana']);

      expect(exitCode).toBe(1);
      expect(output.errors.join('\n')).toContain('Já existe');
      expect(await people.findByEmail(email)).toMatchObject({
        name: 'Ana Souza',
      });
    });

    it('recusa uma senha acima de 256 caracteres', async () => {
      const email = uniqueEmail();
      const output = recordingOutput();
      const command = new AccountsCommand(
        people,
        givenPassword('a'.repeat(257)),
        output,
      );

      const exitCode = await command.run(['create', email, 'Ana Souza']);

      expect(exitCode).toBe(1);
      expect(output.errors.join('\n')).toContain('no máximo 256');
      expect(await people.findByEmail(email)).toBeNull();
    });
  });
});
