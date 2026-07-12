import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Space } from './space.entity';

@Entity('space_availabilities')
@Unique(['spaceId', 'date'])
export class SpaceAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Space, (space) => space.availabilities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space: Space;

  @Column({ name: 'space_id' })
  spaceId: string;

  @Column({ type: 'date' })
  date: string; // Date 객체 또는 YYYY-MM-DD 포맷의 문자열

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;
}
