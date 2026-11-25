import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toPublicUser } from '../auth/auth.service';
import type { PublicUser } from '../auth/auth.types';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async findAll(): Promise<PublicUser[]> {
    const list = await this.users.find({ order: { createdAt: 'ASC' } });
    return list.map(toPublicUser);
  }
}
