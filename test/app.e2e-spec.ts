import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from './../src/common/all-exceptions.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  });

  it('/v1 (GET) trả về lời chào', () => {
    return request(app.getHttpServer())
      .get('/v1')
      .expect(200)
      .expect('Chào mừng đến với chợ đồ cũ!');
  });

  it('/v1/settings (GET) trả về đơn vị tiền tệ và giới hạn giá', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/settings')
      .expect(200);

    expect(response.body).toEqual({
      currency: 'VND',
      priceLimit: expect.any(Number),
    });
  });

  it('/settings (GET) không có tiền tố phiên bản trả về 404 theo cấu trúc chuẩn', async () => {
    const response = await request(app.getHttpServer())
      .get('/settings')
      .expect(404);

    expect(response.body).toEqual({
      code: 'NOT_FOUND',
      message: 'Cannot GET /settings',
      path: '/settings',
      timestamp: expect.any(String),
    });
  });

  it('/v1/health (GET) trả về 200 khi cơ sở dữ liệu sẵn sàng', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      info: {
        database: {
          status: 'up',
        },
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
