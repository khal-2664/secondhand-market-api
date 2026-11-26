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
import { buildTypeOrmOptions } from './database/typeorm.options';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmOptions(config),
    }),
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService, currencyProvider, priceLimitProvider],
})
export class AppModule {}
