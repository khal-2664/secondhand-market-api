import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function contextWith(user?: { role: string }) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  it('endpoint không gắn @Roles() thì cho qua', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextWith({ role: 'member' }))).toBe(true);
  });

  it('đúng vai trò thì cho qua', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    expect(guard.canActivate(contextWith({ role: 'admin' }))).toBe(true);
  });

  it('không đủ vai trò trả 403 FORBIDDEN_ROLE', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    expect(() => guard.canActivate(contextWith({ role: 'member' }))).toThrow(
      expect.objectContaining({
        code: 'FORBIDDEN_ROLE',
        status: HttpStatus.FORBIDDEN,
      }),
    );
  });
});
