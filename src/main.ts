import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableShutdownHooks();
  app.use(helmet());
  app.enableCors({
    origin: config
      .get<string>('CORS_ORIGINS', '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API sàn mua bán đồ cũ')
    .setDescription('REST API cho hệ thống mua bán đồ cũ')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('app', 'Thông tin chung và cấu hình hệ thống')
    .addTag('auth', 'Đăng ký, đăng nhập và tài khoản hiện tại')
    .addTag('users', 'Quản lý người dùng (quản trị viên)')
    .addTag('health', 'Kiểm tra trạng thái hệ thống')
    .addTag('posts', 'Tin đăng')
    .addTag('orders', 'Đơn mua')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(config.get<string>('PORT', '3000'));
  await app.listen(port);
}
void bootstrap();
