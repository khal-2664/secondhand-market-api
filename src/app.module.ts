import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv } from './config/env.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  currencyProvider,
  priceLimitProvider,
} from './common/business.providers';
import { Category } from './entities/category.entity';
import { Order } from './entities/order.entity';
import { Post } from './entities/post.entity';
import { Review } from './entities/review.entity';
import { User } from './entities/user.entity';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [User, Category, Post, Order, Review],
        synchronize: false,
      }),
    }),
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService, currencyProvider, priceLimitProvider],
})
export class AppModule {}
