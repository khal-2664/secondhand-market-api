import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Chào mừng đến với chợ đồ cũ!');
  });

  it('/settings (GET) trả về đơn vị tiền tệ và giới hạn giá', async () => {
    const response = await request(app.getHttpServer())
      .get('/settings')
      .expect(200);

    expect(response.body).toEqual({
      currency: 'VND',
      priceLimit: expect.any(Number),
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
