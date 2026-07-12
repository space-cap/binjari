import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Space } from './space.entity';

@Entity('space_images')
export class SpaceImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Space, (space) => space.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space: Space;

  @Column({ name: 'space_id' })
  spaceId: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
