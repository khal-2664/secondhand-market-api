import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { JwtPayload, PublicUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Tạo tài khoản thành công' })
  @ApiResponse({ status: 400, description: 'Thiếu tên, email hoặc mật khẩu' })
  @ApiResponse({
    status: 409,
    description: 'Email đã được sử dụng (EMAIL_TAKEN)',
  })
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập lấy access token' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả accessToken',
  })
  @ApiResponse({
    status: 401,
    description: 'Sai email hoặc mật khẩu (INVALID_CREDENTIALS)',
  })
  login(@Body() dto: LoginDto): Promise<{ accessToken: string }> {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng đang đăng nhập',
  })
  @ApiResponse({
    status: 401,
    description:
      'Thiếu token (MISSING_TOKEN) hoặc token không hợp lệ (INVALID_TOKEN)',
  })
  me(@CurrentUser() user: JwtPayload): Promise<PublicUser> {
    return this.auth.me(user.id);
  }
}
