import 'dotenv/config';
import { DataSource } from 'typeorm';
import { validateEnv } from './config/env.schema';
import { buildDataSourceOptions } from './database/typeorm.options';

export default new DataSource({
  ...buildDataSourceOptions(validateEnv(process.env)),
  migrations: ['dist/migrations/*.js'],
});
