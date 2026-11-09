import { NestFactory } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { ConversationsService } from '../conversations/conversations.service';
import { ChannelsCommand } from './channels.command';
import { ChannelsModule } from './channels.module';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(ChannelsModule, {
    logger: ['error', 'warn'],
  });
  try {
    const command = new ChannelsCommand(app.get(ConversationsService), {
      info: console.log,
      error: console.error,
    });
    // Contexto do CLS fora do HTTP (AGENTS.md da API, "Transações").
    process.exitCode = await app
      .get(ClsService)
      .run(() => command.run(process.argv.slice(2)));
  } finally {
    await app.close();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
