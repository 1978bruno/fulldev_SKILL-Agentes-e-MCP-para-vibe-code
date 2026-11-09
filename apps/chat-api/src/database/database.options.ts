import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export function buildDataSourceOptions(databaseUrl: string) {
  return {
    type: 'postgres' as const,
    url: databaseUrl,
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
  };
}
