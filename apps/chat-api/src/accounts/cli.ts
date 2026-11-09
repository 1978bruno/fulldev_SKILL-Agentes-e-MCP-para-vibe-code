import { NestFactory } from '@nestjs/core';
import { PeopleService } from '../people/people.service';
import { SessionsService } from '../sessions/sessions.service';
import { AccountsCommand } from './accounts.command';
import { AccountsModule } from './accounts.module';
import { TtyPasswordPrompt } from './password-prompt';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AccountsModule, {
    logger: ['error', 'warn'],
  });
  try {
    const command = new AccountsCommand(
      app.get(PeopleService),
      app.get(SessionsService),
      new TtyPasswordPrompt(),
      { info: console.log, error: console.error },
    );
    process.exitCode = await command.run(process.argv.slice(2));
  } finally {
    await app.close();
  }
}
main().catch((error: unknown) => {
  // Ctrl+C na senha, banco fora do ar: mensagem curta e saída com falha, sem rejeição solta.
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
