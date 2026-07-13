import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { Space } from './entities/space.entity';
import { SpaceImage } from './entities/space-image.entity';
import { SpaceAmenity } from './entities/space-amenity.entity';
import { SpaceAvailability } from './entities/space-availability.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Space,
      SpaceImage,
      SpaceAmenity,
      SpaceAvailability,
      User,
    ]),
  ],
  controllers: [SpacesController],
  providers: [SpacesService],
  exports: [SpacesService, TypeOrmModule],
})
export class SpacesModule {}
