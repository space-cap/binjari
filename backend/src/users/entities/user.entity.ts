import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { UserBusiness } from './user-business.entity';

export enum UserRole {
  GUEST = 'guest',
  HOST = 'host',
  BOTH = 'both',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'profile_image', type: 'varchar', length: 500, nullable: true })
  profileImage: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.GUEST,
  })
  role: UserRole;

  @Column({ name: 'kakao_id', unique: true, type: 'varchar', length: 100, nullable: true })
  kakaoId: string | null;

  @Column({ name: 'google_id', unique: true, type: 'varchar', length: 100, nullable: true })
  googleId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // 1:1 관계 설정
  @OneToOne(() => UserBusiness, (business) => business.user)
  business: UserBusiness;
}
