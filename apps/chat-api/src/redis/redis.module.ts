import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { Env } from '../config/env.schema';

export type RedisClient = ReturnType<typeof createClient>;

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

// Cliente do Redis da API do chat (LLD, "Integrações externas"). Sem a fila de comandos offline: com
// o Redis fora, o comando falha na hora, em vez de prender quem chamou até a reconexão. A conexão
// sobe sem esperar o Redis, e a API sobe mesmo com ele fora.
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): RedisClient => {
        const logger = new Logger('Redis');
        const client = createClient({
          url: config.get('REDIS_URL', { infer: true }),
          disableOfflineQueue: true,
        });
        client.on('error', (error: unknown) =>
          logger.error('Falha na conexão com o Redis', error),
        );
        client
          .connect()
          .catch((error: unknown) =>
            logger.error('Não foi possível conectar ao Redis', error),
          );
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {}

  // O cliente pode já estar fechado: o Redis caiu antes, ou nunca conectou.
  onApplicationShutdown(): void {
    if (this.client.isOpen) this.client.destroy();
  }
}
