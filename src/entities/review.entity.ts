import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity({ name: 'reviews' })
@Check('CHK_reviews_stars_range', '"stars" >= 1 AND "stars" <= 5')
export class Review extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'reviewer_id', type: 'uuid' })
  reviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewee_id', type: 'uuid' })
  revieweeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewee_id' })
  reviewee: User;

  @Column({ type: 'smallint' })
  stars: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
