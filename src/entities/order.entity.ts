import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

@Entity({ name: 'orders' })
@Check('CHK_orders_amount_positive', '"amount" > 0')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'buyer_id', type: 'uuid' })
  buyerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ type: 'integer' })
  amount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status',
    default: OrderStatus.Pending,
  })
  status: OrderStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
