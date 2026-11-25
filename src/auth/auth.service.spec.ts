import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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
  const jwt = { signAsync: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(users as never, jwt as unknown as JwtService);
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

    it('đúng mật khẩu trả accessToken ký từ id, email, role', async () => {
      users.findOneBy.mockResolvedValue(user);
      jwt.signAsync.mockResolvedValue('token');

      await expect(
        service.login({ email: 'a@x.com', password: 'matkhau123' }),
      ).resolves.toEqual({ accessToken: 'token' });
      expect(jwt.signAsync).toHaveBeenCalledWith({
        id: 'u1',
        email: 'a@x.com',
        role: 'member',
      });
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
});
