import { execFileSync } from 'node:child_process';
import { Client } from 'pg';

export default async function globalSetup(): Promise<void> {
  const adminUrl = process.env.TEST_DATABASE_ADMIN_URL;
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!adminUrl || !testUrl) {
    throw new Error(
      'TEST_DATABASE_URL e TEST_DATABASE_ADMIN_URL são obrigatórias',
    );
  }
  const dbName = new URL(testUrl).pathname.slice(1);

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (!rowCount) {
      await admin.query(`CREATE DATABASE "${dbName}" OWNER chat`);
      await admin.query(`REVOKE CONNECT ON DATABASE "${dbName}" FROM PUBLIC`);
      await admin.query(`GRANT CONNECT ON DATABASE "${dbName}" TO chat`);
    }
  } finally {
    await admin.end();
  }

  execFileSync('pnpm', ['migration:run'], {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'inherit',
  });
}
