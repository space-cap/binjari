import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Space } from './space.entity';

export enum AmenityType {
  WIFI = 'wifi',
  PARKING = 'parking',
  PHONE_OK = 'phone_ok',
  VIDEO_CALL_OK = 'video_call_ok',
  PRINTER = 'printer',
  KITCHEN = 'kitchen',
  LOCKER = 'locker',
  HOURS_24 = '24hours',
}

@Entity('space_amenities')
export class SpaceAmenity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Space, (space) => space.amenities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space: Space;

  @Column({ name: 'space_id' })
  spaceId: string;

  @Column({
    type: 'enum',
    enum: AmenityType,
  })
  amenity: AmenityType;
}
