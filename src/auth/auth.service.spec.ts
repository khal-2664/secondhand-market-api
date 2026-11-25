import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { AppError } from '../common/app-error';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const users = {
    existsBy: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((data: Partial<User>) => data),
    save: jest.fn(),
  };
  const refreshTokens = {
    findOneBy: jest.fn(),
    update: jest.fn(),
    create: jest.fn((data: Record<string, unknown>) => data),
    save: jest.fn(async (data: Record<string, unknown>) => data),
  };
  const jwt = { signAsync: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      users as never,
      refreshTokens as never,
      jwt as unknown as JwtService,
    );
  });

  describe('register', () => {
    it('băm mật khẩu bằng bcrypt và không trả passwordHash', async () => {
      users.existsBy.mockResolvedValue(false);
      users.save.mockImplementation(async (u: Partial<User>) => ({
        ...u,
        id: 'u1',
        role: 'member',
      }));

      const result = await service.register({
        name: ' An ',
        email: 'An@Example.com',
        password: 'matkhau123',
      });

      expect(result).toEqual({
        id: 'u1',
        name: 'An',
        email: 'an@example.com',
        role: 'member',
      });
      const saved = users.save.mock.calls[0][0] as User;
      expect(saved.passwordHash).toMatch(/^\$2b\$10\$/);
      expect(saved.passwordHash).toHaveLength(60);
      await expect(
        bcrypt.compare('matkhau123', saved.passwordHash),
      ).resolves.toBe(true);
    });

    it('email trùng trả 409 EMAIL_TAKEN', async () => {
      users.existsBy.mockResolvedValue(true);

      await expect(
        service.register({ name: 'An', email: 'a@x.com', password: '123456' }),
      ).rejects.toMatchObject({
        code: 'EMAIL_TAKEN',
        status: HttpStatus.CONFLICT,
      });
      expect(users.save).not.toHaveBeenCalled();
    });

    it('thiếu trường bắt buộc trả 400 VALIDATION_ERROR', async () => {
      await expect(
        service.register({ name: '', email: 'a@x.com', password: '' }),
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe('login', () => {
    const hash = bcrypt.hashSync('matkhau123', 4);
    const user = {
      id: 'u1',
      email: 'a@x.com',
      role: 'member',
      passwordHash: hash,
    } as User;

    it('đúng mật khẩu trả accessToken và refreshToken, chỉ lưu băm của refresh token', async () => {
      users.findOneBy.mockResolvedValue(user);
      jwt.signAsync.mockResolvedValue('token');

      const result = await service.login({
        email: 'a@x.com',
        password: 'matkhau123',
      });

      expect(result.accessToken).toBe('token');
      expect(result.refreshToken).toMatch(/^[0-9a-f]{64}$/);
      expect(jwt.signAsync).toHaveBeenCalledWith({
        id: 'u1',
        email: 'a@x.com',
        role: 'member',
      });
      const saved = refreshTokens.save.mock.calls[0][0] as {
        tokenHash: string;
        expiresAt: Date;
      };
      expect(saved.tokenHash).toBe(
        createHash('sha256').update(result.refreshToken).digest('hex'),
      );
      expect(saved.tokenHash).not.toBe(result.refreshToken);
      const days = (saved.expiresAt.getTime() - Date.now()) / 86_400_000;
      expect(Math.round(days)).toBe(7);
    });

    it('sai mật khẩu và sai email trả cùng một lỗi INVALID_CREDENTIALS', async () => {
      users.findOneBy.mockResolvedValueOnce(user).mockResolvedValueOnce(null);

      const wrongPassword = await service
        .login({ email: 'a@x.com', password: 'sai' })
        .catch((e: AppError) => e);
      const wrongEmail = await service
        .login({ email: 'khongco@x.com', password: 'matkhau123' })
        .catch((e: AppError) => e);

      expect(wrongPassword).toBeInstanceOf(AppError);
      expect(wrongEmail).toBeInstanceOf(AppError);
      expect((wrongPassword as AppError).getResponse()).toEqual(
        (wrongEmail as AppError).getResponse(),
      );
      expect((wrongPassword as AppError).getStatus()).toBe(
        HttpStatus.UNAUTHORIZED,
      );
      expect((wrongPassword as AppError).code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('refresh', () => {
    const user = { id: 'u1', email: 'a@x.com', role: 'member' } as User;
    const future = new Date(Date.now() + 60_000);

    it('token hợp lệ thì thu hồi token cũ và cấp cặp mới', async () => {
      refreshTokens.findOneBy.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: future,
      });
      refreshTokens.update.mockResolvedValue({ affected: 1 });
      users.findOneBy.mockResolvedValue(user);
      jwt.signAsync.mockResolvedValue('new-access');

      const result = await service.refresh('old-token');

      expect(refreshTokens.findOneBy).toHaveBeenCalledWith({
        tokenHash: createHash('sha256').update('old-token').digest('hex'),
      });
      expect(refreshTokens.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'r1' }),
        { revokedAt: expect.any(Date) },
      );
      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).not.toBe('old-token');
    });

    it.each([
      ['không tồn tại', null],
      [
        'đã thu hồi',
        { id: 'r1', userId: 'u1', revokedAt: new Date(), expiresAt: future },
      ],
      [
        'đã hết hạn',
        { id: 'r1', userId: 'u1', revokedAt: null, expiresAt: new Date(0) },
      ],
    ])('token %s trả 401 INVALID_REFRESH_TOKEN', async (_name, stored) => {
      refreshTokens.findOneBy.mockResolvedValue(stored);

      await expect(service.refresh('some-token')).rejects.toMatchObject({
        code: 'INVALID_REFRESH_TOKEN',
        status: HttpStatus.UNAUTHORIZED,
      });
      expect(refreshTokens.update).not.toHaveBeenCalled();
    });

    it('hai request dùng cùng token thì request đến sau bị từ chối', async () => {
      refreshTokens.findOneBy.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: future,
      });
      refreshTokens.update.mockResolvedValue({ affected: 0 });

      await expect(service.refresh('old-token')).rejects.toMatchObject({
        code: 'INVALID_REFRESH_TOKEN',
      });
    });
  });
});
