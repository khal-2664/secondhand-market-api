import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { AppError } from '../common/app-error';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';
import type { AuthTokens, JwtPayload, PublicUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_COST = 10;
const PG_UNIQUE_VIOLATION = '23505';
// so sánh với một hash giả khi email không tồn tại để thời gian phản hồi
// giống trường hợp sai mật khẩu
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_COST);
const REFRESH_TOKEN_BYTES = 32;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const name = typeof dto?.name === 'string' ? dto.name.trim() : '';
    const email = normalizeEmail(dto?.email);
    const password = typeof dto?.password === 'string' ? dto.password : '';
    if (!name || !email || !password) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Cần nhập đủ tên, email và mật khẩu',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (await this.users.existsBy({ email })) {
      throw emailTaken();
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    try {
      const user = await this.users.save(
        this.users.create({ name, email, passwordHash }),
      );
      return toPublicUser(user);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string })?.code === PG_UNIQUE_VIOLATION
      ) {
        throw emailTaken();
      }
      throw err;
    }
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const email = normalizeEmail(dto?.email);
    const password = typeof dto?.password === 'string' ? dto.password : '';
    const user = email ? await this.users.findOneBy({ email }) : null;
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        'Email hoặc mật khẩu không đúng',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: unknown): Promise<AuthTokens> {
    const invalid = new AppError(
      'INVALID_REFRESH_TOKEN',
      'Refresh token không hợp lệ, đã hết hạn hoặc đã bị thu hồi',
      HttpStatus.UNAUTHORIZED,
    );
    if (typeof refreshToken !== 'string' || !refreshToken) throw invalid;

    const stored = await this.refreshTokens.findOneBy({
      tokenHash: sha256(refreshToken),
    });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
      throw invalid;
    }

    // thu hồi có điều kiện để hai request dùng cùng token không cùng qua được
    const revoked = await this.refreshTokens.update(
      { id: stored.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    if (!revoked.affected) throw invalid;

    const user = await this.users.findOneBy({ id: stored.userId });
    if (!user) throw invalid;
    return this.issueTokens(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) {
      throw new AppError(
        'INVALID_TOKEN',
        'Token không hợp lệ hoặc đã hết hạn',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return toPublicUser(user);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        revokedAt: null,
      }),
    );

    return { accessToken, refreshToken };
  }
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function emailTaken(): AppError {
  return new AppError(
    'EMAIL_TAKEN',
    'Email đã được sử dụng',
    HttpStatus.CONFLICT,
  );
}
