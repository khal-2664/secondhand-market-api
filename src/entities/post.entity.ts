import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { POST_TITLE_MAX_LENGTH } from '../common/constants/column-lengths';
import { PostStatus } from '../enums/post-status.enum';
import { AbstractEntity } from './abstract.entity';
import { Category } from './category.entity';
import { User } from './user.entity';

@Entity({ name: 'posts' })
@Check('CHK_posts_price_positive', '"price" > 0')
export class Post extends AbstractEntity {
  @Column({ type: 'varchar', length: POST_TITLE_MAX_LENGTH })
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

  @Index()
  @Column({ name: 'seller_id', type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Index()
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
