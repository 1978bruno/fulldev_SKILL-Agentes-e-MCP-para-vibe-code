import { DataSource } from 'typeorm';
import { loadEnv } from '../config/env.schema';
import { buildDataSourceOptions } from './database.options';

export default new DataSource({
  ...buildDataSourceOptions(loadEnv().DATABASE_URL),
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../../migrations/*.{ts,js}'],
});
