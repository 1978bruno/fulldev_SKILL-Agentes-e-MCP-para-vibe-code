import { spawnSync } from 'node:child_process';

describe('subida da API', () => {
  it('a API não sobe sem DATABASE_URL e diz o nome da variável', () => {
    const env: NodeJS.ProcessEnv = { ...process.env };
    delete env.DATABASE_URL;

    const result = spawnSync('pnpm', ['exec', 'ts-node', 'src/main.ts'], {
      env,
      encoding: 'utf8',
      timeout: 60_000,
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('DATABASE_URL');
  }, 70_000);

  it('a API não sobe sem WEB_ORIGIN e diz o nome da variável', () => {
    const env: NodeJS.ProcessEnv = { ...process.env };
    delete env.WEB_ORIGIN;

    const result = spawnSync('pnpm', ['exec', 'ts-node', 'src/main.ts'], {
      env,
      encoding: 'utf8',
      timeout: 60_000,
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('WEB_ORIGIN');
  }, 70_000);
});
