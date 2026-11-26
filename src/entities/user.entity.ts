import { Check, Column, Entity } from 'typeorm';
import {
  PASSWORD_HASH_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
} from '../common/constants/column-lengths';
import { BaseEntity } from './base.entity';

@Entity({ name: 'users' })
@Check('CHK_users_rating_range', '"rating" >= 0 AND "rating" <= 5')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: USER_NAME_MAX_LENGTH })
  name: string;

  @Column({ type: 'varchar', length: USER_EMAIL_MAX_LENGTH, unique: true })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: PASSWORD_HASH_LENGTH,
    select: false,
  })
  passwordHash: string;

  @Column({
    type: 'numeric',
    precision: 2,
    scale: 1,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  rating: number;
}
