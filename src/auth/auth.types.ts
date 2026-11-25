import type { UserRole } from '../entities/user.entity';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
