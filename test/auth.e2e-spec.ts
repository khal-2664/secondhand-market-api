import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from './../src/common/all-exceptions.filter';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const email = `e2e.auth.${Date.now()}@example.com`;
  const password = 'matkhau123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM users WHERE email = $1', [email]);
    await app.close();
  });

  const login = (body: object) =>
    request(app.getHttpServer()).post('/v1/auth/login').send(body);

  it('đăng ký trả 201 không có passwordHash, trùng email trả 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ name: 'E2E', email, password })
      .expect(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      name: 'E2E',
      email,
      role: 'member',
    });

    const dup = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ name: 'E2E', email, password })
      .expect(409);
    expect(dup.body.code).toBe('EMAIL_TAKEN');
  });

  it('sai mật khẩu và sai email trả cùng một lỗi', async () => {
    const a = await login({ email, password: 'sai' }).expect(401);
    const b = await login({ email: `x.${email}`, password }).expect(401);
    expect(a.body.code).toBe('INVALID_CREDENTIALS');
    expect(a.body.message).toBe(b.body.message);
    expect(a.body.code).toBe(b.body.code);
  });

  it('/me: không token 401, token hỏng 401, token hợp lệ 200', async () => {
    const server = app.getHttpServer();
    const missing = await request(server).get('/v1/auth/me').expect(401);
    expect(missing.body.code).toBe('MISSING_TOKEN');

    const broken = await request(server)
      .get('/v1/auth/me')
      .set('Authorization', 'Bearer abc.def.ghi')
      .expect(401);
    expect(broken.body.code).toBe('INVALID_TOKEN');

    const { body } = await login({ email, password }).expect(200);
    expect(body.accessToken.split('.')).toHaveLength(3);
    const payload = JSON.parse(
      Buffer.from(body.accessToken.split('.')[1], 'base64url').toString(),
    );
    expect(Object.keys(payload).sort()).toEqual(
      ['email', 'exp', 'iat', 'id', 'role'].sort(),
    );

    const me = await request(server)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(200);
    expect(me.body).toMatchObject({ email, role: 'member' });
    expect(me.body.passwordHash).toBeUndefined();
  });

  it('member gọi endpoint admin trả 403, thành admin thì 200, token hỏng trả INVALID_TOKEN', async () => {
    const server = app.getHttpServer();
    const member = await login({ email, password }).expect(200);
    const forbidden = await request(server)
      .get('/v1/users')
      .set('Authorization', `Bearer ${member.body.accessToken}`)
      .expect(403);
    expect(forbidden.body.code).toBe('FORBIDDEN_ROLE');

    const broken = await request(server)
      .get('/v1/users')
      .set('Authorization', 'Bearer abc.def.ghi')
      .expect(401);
    expect(broken.body.code).toBe('INVALID_TOKEN');

    await dataSource.query(`UPDATE users SET role = 'admin' WHERE email = $1`, [
      email,
    ]);
    const admin = await login({ email, password }).expect(200);
    await request(server)
      .get('/v1/users')
      .set('Authorization', `Bearer ${admin.body.accessToken}`)
      .expect(200);
    await dataSource.query(
      `UPDATE users SET role = 'member' WHERE email = $1`,
      [email],
    );
  });

  it('xoay refresh token: token cũ dùng lại trả 401, token mới vẫn dùng được', async () => {
    await new Promise((r) => setTimeout(r, 10_500)); // hết cửa sổ giới hạn login
    const server = app.getHttpServer();
    const first = await login({ email, password }).expect(200);
    expect(first.body.refreshToken).toMatch(/^[0-9a-f]{64}$/);

    const rotated = await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: first.body.refreshToken })
      .expect(200);
    expect(rotated.body.refreshToken).not.toBe(first.body.refreshToken);

    const reuse = await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: first.body.refreshToken })
      .expect(401);
    expect(reuse.body.code).toBe('INVALID_REFRESH_TOKEN');

    await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(200);
  }, 20_000);

  it('login vượt giới hạn trả 429 kèm Retry-After-short, health không bị giới hạn', async () => {
    await new Promise((r) => setTimeout(r, 10_500));
    const statuses: number[] = [];
    let last: request.Response | undefined;
    for (let i = 0; i < 6; i++) {
      last = await login({ email, password: 'sai' });
      statuses.push(last.status);
    }
    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses[5]).toBe(429);
    expect(last?.headers['retry-after-short']).toBeDefined();

    for (let i = 0; i < 40; i++) {
      await request(app.getHttpServer()).get('/v1/health').expect(200);
    }
  }, 20_000);
});
