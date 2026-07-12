import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserBusiness } from './entities/user-business.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserBusiness])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
