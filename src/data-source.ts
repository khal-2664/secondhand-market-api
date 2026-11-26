import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database/typeorm.options';

export default new DataSource({
  ...buildDataSourceOptions(process.env),
  migrations: ['dist/migrations/*.js'],
});
