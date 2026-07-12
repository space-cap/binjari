import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SpaceImage } from './space-image.entity';
import { SpaceAmenity } from './space-amenity.entity';
import { SpaceAvailability } from './space-availability.entity';

export enum SpaceStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REJECTED = 'rejected',
}

@Entity('spaces')
export class Space {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_id' })
  host: User;

  @Column({ name: 'host_id' })
  hostId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ name: 'address_summary', type: 'varchar', length: 200 })
  addressSummary: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'integer', default: 1 })
  capacity: number;

  @Column({ name: 'price_daily', type: 'integer', nullable: true })
  priceDaily: number;

  @Column({ name: 'price_weekly', type: 'integer', nullable: true })
  priceWeekly: number;

  @Column({ name: 'price_monthly', type: 'integer', nullable: true })
  priceMonthly: number;

  @Column({
    type: 'enum',
    enum: SpaceStatus,
    default: SpaceStatus.PENDING,
  })
  status: SpaceStatus;

  @Column({ name: 'is_instant_book', type: 'boolean', default: false })
  isInstantBook: boolean;

  @Column({
    name: 'avg_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.0,
  })
  avgRating: number;

  @Column({ name: 'review_count', type: 'integer', default: 0 })
  reviewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 관계 설정 (1:N)
  @OneToMany(() => SpaceImage, (image) => image.space, { cascade: true })
  images: SpaceImage[];

  @OneToMany(() => SpaceAmenity, (amenity) => amenity.space, { cascade: true })
  amenities: SpaceAmenity[];

  @OneToMany(() => SpaceAvailability, (availability) => availability.space, { cascade: true })
  availabilities: SpaceAvailability[];
}
