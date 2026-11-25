import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { AppError } from '../common/app-error';
import { User } from '../entities/user.entity';
import type { JwtPayload, PublicUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_COST = 10;
const PG_UNIQUE_VIOLATION = '23505';
// so sánh với một hash giả khi email không tồn tại để thời gian phản hồi
// giống trường hợp sai mật khẩu
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_COST);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
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

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
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

    return { accessToken: await this.signAccessToken(user) };
  }

  private signAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.signAsync(payload);
  }
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
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
