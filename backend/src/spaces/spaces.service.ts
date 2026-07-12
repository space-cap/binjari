import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Space } from './entities/space.entity';
import { SpaceAmenity } from './entities/space-amenity.entity';
import { CreateSpaceDto } from './dto/create-space.dto';

@Injectable()
export class SpacesService {
  constructor(
    @InjectRepository(Space)
    private readonly spaceRepository: Repository<Space>,
    @InjectRepository(SpaceAmenity)
    private readonly amenityRepository: Repository<SpaceAmenity>,
  ) {}

  /**
   * 신규 오피스 공간 등록
   */
  async createSpace(hostId: string, dto: CreateSpaceDto): Promise<Space> {
    // 1. 공간 기본 엔티티 생성
    const space = this.spaceRepository.create({
      title: dto.title,
      description: dto.description,
      address: dto.address,
      addressSummary: dto.addressSummary,
      latitude: dto.latitude,
      longitude: dto.longitude,
      capacity: dto.capacity,
      priceDaily: dto.priceDaily,
      priceWeekly: dto.priceWeekly,
      priceMonthly: dto.priceMonthly,
      isInstantBook: dto.isInstantBook ?? false,
      hostId,
    });

    const savedSpace = await this.spaceRepository.save(space);

    // 2. 편의시설 항목이 주어지면 매핑하여 추가 저장
    if (dto.amenities && dto.amenities.length > 0) {
      const amenityEntities = dto.amenities.map((amenity) =>
        this.amenityRepository.create({
          spaceId: savedSpace.id,
          amenity,
        }),
      );
      await this.amenityRepository.save(amenityEntities);
      
      // 최신 편의시설 목록 바인딩
      savedSpace.amenities = amenityEntities;
    }

    return savedSpace;
  }

  /**
   * 공간 목록 조회 (검색용)
   */
  async findAll(): Promise<Space[]> {
    return this.spaceRepository.find({
      relations: {
        images: true,
        amenities: true,
      },
    });
  }
}
