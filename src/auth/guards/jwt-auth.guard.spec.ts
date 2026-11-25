import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AppError } from '../../common/app-error';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextWith(headers: Record<string, string>) {
  const req: { headers: Record<string, string>; user?: unknown } = { headers };
  const ctx = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { ctx, req };
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: 'test-secret' });
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new JwtAuthGuard(jwt, reflector as unknown as Reflector);

  beforeEach(() => reflector.getAllAndOverride.mockReturnValue(false));

  it('cho qua endpoint gắn @Public() mà không cần token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { ctx } = contextWith({});
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it.each([
    ['không có header', {}],
    ['sai lược đồ', { authorization: 'Basic abc' }],
    ['Bearer rỗng', { authorization: 'Bearer' }],
  ])('%s trả 401 MISSING_TOKEN', async (_name, headers) => {
    const { ctx } = contextWith(headers);
    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      code: 'MISSING_TOKEN',
      status: HttpStatus.UNAUTHORIZED,
    });
  });

  it('token hỏng trả 401 INVALID_TOKEN', async () => {
    const { ctx } = contextWith({ authorization: 'Bearer abc.def.ghi' });
    const err = await guard.canActivate(ctx).catch((e: AppError) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe('INVALID_TOKEN');
  });

  it('token hết hạn trả 401 INVALID_TOKEN', async () => {
    const token = await jwt.signAsync(
      { id: 'u1', email: 'a@x.com', role: 'member' },
      { expiresIn: -1 },
    );
    const { ctx } = contextWith({ authorization: `Bearer ${token}` });
    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    });
  });

  it('token hợp lệ gắn payload vào req.user', async () => {
    const token = await jwt.signAsync({
      id: 'u1',
      email: 'a@x.com',
      role: 'member',
    });
    const { ctx, req } = contextWith({ authorization: `Bearer ${token}` });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user).toMatchObject({
      id: 'u1',
      email: 'a@x.com',
      role: 'member',
    });
  });
});
