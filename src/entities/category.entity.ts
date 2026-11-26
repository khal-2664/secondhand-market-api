import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_SLUG_MAX_LENGTH,
} from '../common/constants/column-lengths';

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: CATEGORY_NAME_MAX_LENGTH })
  name: string;

  @Column({ type: 'varchar', length: CATEGORY_SLUG_MAX_LENGTH, unique: true })
  slug: string;
}
