import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Category } from './entities/category.entity';
import { Order } from './entities/order.entity';
import { Post } from './entities/post.entity';
import { Review } from './entities/review.entity';
import { User } from './entities/user.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Category, Post, Order, Review],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
