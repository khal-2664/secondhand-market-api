import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { User } from './user.entity';

export enum PostStatus {
  Available = 'available',
  Reserved = 'reserved',
  Sold = 'sold',
}

@Entity({ name: 'posts' })
@Check('CHK_posts_price_positive', '"price" > 0')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer' })
  price: number;

  @Column({
    type: 'enum',
    enum: PostStatus,
    enumName: 'post_status',
    default: PostStatus.Available,
  })
  status: PostStatus;

  @Column({ name: 'seller_id', type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
