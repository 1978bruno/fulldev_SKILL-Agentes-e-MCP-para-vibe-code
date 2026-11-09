import { INestApplicationContext, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';

export interface CommandOutput {
  info(message: string): void;
  error(message: string): void;
}

export interface Command {
  // Devolve o código de saída do processo.
  run(args: string[]): Promise<number>;
}

export const CONSOLE_OUTPUT: CommandOutput = {
  info: console.log,
  error: console.error,
};

// Sobe o contexto do Nest sem HTTP, roda o comando dentro de um contexto do CLS (AGENTS.md da
// API, "Transações") e fecha o contexto. Uma falha inesperada vira mensagem curta e saída 1.
export function runCommand(
  module: Type,
  build: (app: INestApplicationContext) => Command,
): void {
  const main = async (): Promise<void> => {
    const app = await NestFactory.createApplicationContext(module, {
      logger: ['error', 'warn'],
    });
    try {
      const command = build(app);
      process.exitCode = await app
        .get(ClsService)
        .run(() => command.run(process.argv.slice(2)));
    } finally {
      await app.close();
    }
  };
  main().catch((error: unknown) => {
    // Ctrl+C na senha, banco fora do ar: mensagem curta e saída com falha, sem rejeição solta.
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
