import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../../common/app-error';
import type { UserRole } from '../../entities/user.entity';
import type { AuthRequest } from '../auth.types';
import { ROLES } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    if (!req.user || !required.includes(req.user.role)) {
      throw new AppError(
        'FORBIDDEN_ROLE',
        'Vai trò không đủ quyền',
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
