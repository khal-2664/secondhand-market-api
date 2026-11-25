import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { PublicUser } from '../auth/auth.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Danh sách người dùng (chỉ quản trị viên)' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng' })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Không phải quản trị viên (FORBIDDEN_ROLE)',
  })
  findAll(): Promise<PublicUser[]> {
    return this.usersService.findAll();
  }
}
