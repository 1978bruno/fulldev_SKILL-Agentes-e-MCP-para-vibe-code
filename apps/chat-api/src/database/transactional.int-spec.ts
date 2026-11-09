import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { INestApplicationContext, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUIDv7 } from 'node:crypto';
import { DataSource } from 'typeorm';
import { uniqueEmail } from '../../test/support/unique-email';
import { AppConfigModule } from '../config/config.module';
import { PeopleModule } from '../people/people.module';
import { PeopleService } from '../people/people.service';
import { DatabaseModule } from './database.module';

// Um service de outro módulo que grava pelo TransactionHost, no papel que o módulo de Conversas
// terá na F02-T02: participar da transação aberta por quem orquestra.
@Injectable()
class LoginAttemptWriter {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  async write(email: string): Promise<void> {
    await this.txHost.tx.query(
      `INSERT INTO login_attempts (id, email, failed_count, first_failed_at)
       VALUES ($1, $2, 1, now())`,
      [randomUUIDv7(), email],
    );
  }
}

@Module({ providers: [LoginAttemptWriter], exports: [LoginAttemptWriter] })
class LoginAttemptWriterModule {}

@Injectable()
class CreatePersonAndAttempt {
  constructor(
    private readonly people: PeopleService,
    private readonly attempts: LoginAttemptWriter,
  ) {}

  @Transactional()
  async run(email: string, failAtTheEnd: boolean): Promise<void> {
    await this.people.create({ email, name: 'Ana Souza', password: 'senha' });
    await this.attempts.write(email);
    if (failAtTheEnd) throw new Error('falha depois das duas gravações');
  }
}

describe('transação entre módulos', () => {
  let context: INestApplicationContext;
  let operation: CreatePersonAndAttempt;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppConfigModule,
        DatabaseModule,
        PeopleModule,
        LoginAttemptWriterModule,
      ],
      providers: [CreatePersonAndAttempt],
    }).compile();
    context = await moduleRef.init();
    operation = context.get(CreatePersonAndAttempt);
    dataSource = context.get(DataSource);
  });

  afterAll(async () => {
    await context.close();
  });

  async function countRows(email: string) {
    const [people] = await dataSource.query<{ count: string }[]>(
      'SELECT count(*) FROM people WHERE email = $1',
      [email],
    );
    const [attempts] = await dataSource.query<{ count: string }[]>(
      'SELECT count(*) FROM login_attempts WHERE email = $1',
      [email],
    );
    return { people: Number(people.count), attempts: Number(attempts.count) };
  }

  it('desfaz as gravações de dois módulos quando a operação falha', async () => {
    const email = uniqueEmail();

    await expect(operation.run(email, true)).rejects.toThrow(
      'falha depois das duas gravações',
    );

    expect(await countRows(email)).toEqual({ people: 0, attempts: 0 });
  });

  it('grava as duas quando a operação termina', async () => {
    const email = uniqueEmail();

    await operation.run(email, false);

    expect(await countRows(email)).toEqual({ people: 1, attempts: 1 });
  });
});
