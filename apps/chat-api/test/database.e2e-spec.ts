import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './support/create-test-app';

describe('banco de testes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('a aplicação de teste usa o banco chat_test com as migrações rodadas', async () => {
    const dataSource = app.get(DataSource);

    const [{ db, migrations }] = await dataSource.query<
      { db: string; migrations: string }[]
    >(
      "SELECT current_database() AS db, to_regclass('public.migrations') AS migrations",
    );

    expect(db).toBe('chat_test');
    expect(migrations).toBe('migrations');
  });
});
