import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { Env } from '../config/env.schema';
import { buildDataSourceOptions } from './database.options';

// Transação entre módulos pelo CLS: regras no AGENTS.md da API, "Transações".
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        ...buildDataSourceOptions(config.get('DATABASE_URL', { infer: true })),
        autoLoadEntities: true,
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      plugins: [
        new ClsPluginTransactional({
          adapter: new TransactionalAdapterTypeOrm({
            dataSourceToken: getDataSourceToken(),
          }),
        }),
      ],
    }),
  ],
})
export class DatabaseModule {}
