import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Order } from '../entities/order.entity';
import { Post } from '../entities/post.entity';
import { Review } from '../entities/review.entity';
import { User } from '../entities/user.entity';

export const entities = [User, Category, Post, Order, Review];

export type DbConnectionEnv = {
  DB_HOST?: string;
  DB_PORT?: string | number;
  DB_USERNAME?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
};

export function buildDataSourceOptions(
  env: DbConnectionEnv,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    entities,
    synchronize: false,
  };
}

export function buildTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  return buildDataSourceOptions({
    DB_HOST: config.get<string>('DB_HOST'),
    DB_PORT: config.get<string | number>('DB_PORT'),
    DB_USERNAME: config.get<string>('DB_USERNAME'),
    DB_PASSWORD: config.get<string>('DB_PASSWORD'),
    DB_NAME: config.get<string>('DB_NAME'),
  });
}
