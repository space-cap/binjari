import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Space } from './entities/space.entity';
import { SpaceAmenity, AmenityType } from './entities/space-amenity.entity';
import { SpaceImage } from './entities/space-image.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateSpaceDto } from './dto/create-space.dto';

@Injectable()
export class SpacesService implements OnModuleInit {
  constructor(
    @InjectRepository(Space)
    private readonly spaceRepository: Repository<Space>,
    @InjectRepository(SpaceAmenity)
    private readonly amenityRepository: Repository<SpaceAmenity>,
    @InjectRepository(SpaceImage)
    private readonly imageRepository: Repository<SpaceImage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 모듈 기동 시 공간 데이터베이스가 비어 있으면 성수, 홍대, 강남, 여의도, 을지로 힙플레이스 Mock 자동 적재
   */
  async onModuleInit() {
    try {
      // 1. 더미 호스트 사용자 획득 또는 신규 생성
      let host = await this.userRepository.findOne({ where: { email: 'mock_host@binjari.com' } });
      if (!host) {
        host = this.userRepository.create({
          email: 'mock_host@binjari.com',
          name: '공유오피스 대장',
          role: UserRole.HOST,
          isActive: true,
        });
        host = await this.userRepository.save(host);
      }

      const mockSpaceCount = await this.spaceRepository.count({ where: { hostId: host.id } });
      if (mockSpaceCount > 0) return; // 이미 mock 데이터가 존재하면 패스

      console.log('🌱 [Binjari DB] 공간 데이터가 감지되지 않아 Mock 공간 데이터 자동 적재를 가동합니다...');

      // 겹치기 버그를 방지하기 위해 기존 서울시청 좌표 중복 더미 데이터 삭제
      await this.spaceRepository.delete({ latitude: 37.5665, longitude: 126.9780 });

      // 2. 서울 주요 힙플레이스 공간 리스트 데이터 매핑
      const mockSpaces = [
        {
          title: '성수역 도보 4분 빈티지 아틀리에 쉐어라운지',
          description: '성수동 감성의 빈티지 가구와 탁 트인 라운지 형태의 집중 좌석입니다. 고성능 커피머신과 시그니처 블렌드 아메리카노가 무제한 제공되며, 디자이너들과 IT 개발자들의 네트워킹에 적합한 공간입니다.',
          address: '서울특별시 성동구 아차산로 113',
          addressSummary: '성동구 성수동',
          latitude: 37.5445,
          longitude: 127.0560,
          capacity: 8,
          priceDaily: 15000,
          priceWeekly: 90000,
          priceMonthly: 320000,
          isInstantBook: true,
          amenities: ['wifi', 'kitchen', '24hours'] as AmenityType[],
          images: ['/uploads/spaces/mock_shared.png'],
        },
        {
          title: '홍대입구역 듀얼 모니터 집중 코딩석',
          description: '27인치 듀얼 모니터와 시디즈 T50 의자가 완비되어 있어 코딩 및 장시간 컴퓨터 업무를 보시는 프리랜서에게 안성맞춤입니다. 화상 회의가 가능한 프라이빗 폰부스가 무료 제공됩니다.',
          address: '서울특별시 마포구 양화로 160',
          addressSummary: '마포구 동교동',
          latitude: 37.5568,
          longitude: 126.9240,
          capacity: 4,
          priceDaily: 12000,
          priceWeekly: 70000,
          priceMonthly: 250000,
          isInstantBook: false,
          amenities: ['wifi', 'phone_ok', 'printer'] as AmenityType[],
          images: ['/uploads/spaces/mock_desk.png'],
        },
        {
          title: '강남 테헤란로 숲뷰 힐링 라이브러리 오피스',
          description: '삭막한 빌딩 숲 속에서 나무들이 보이는 넓고 아늑한 원목 데스크 존입니다. 잔잔한 클래식 음악이 흐르는 도서관 분위기에서 높은 집중력을 경험해 보세요.',
          address: '서울특별시 강남구 테헤란로 152',
          addressSummary: '강남구 역삼동',
          latitude: 37.4979,
          longitude: 127.0276,
          capacity: 12,
          priceDaily: 18000,
          priceWeekly: 100000,
          priceMonthly: 360000,
          isInstantBook: true,
          amenities: ['wifi', 'parking', 'locker'] as AmenityType[],
          images: ['/uploads/spaces/mock_cozy.png'],
        },
        {
          title: '여의도 한강뷰 프라이빗 1인 비즈니스 핫데스크',
          description: '통창 너머로 한강이 훤히 보이는 탁월한 조망을 자랑하는 프리미엄 오피스 공간입니다. 바이어 미팅 및 투자 유치 회의를 위한 4인 화상 회의 공간이 기본 매핑되어 있습니다.',
          address: '서울특별시 영등포구 여의대로 108',
          addressSummary: '영등포구 여의도동',
          latitude: 37.5216,
          longitude: 126.9241,
          capacity: 2,
          priceDaily: 25000,
          priceWeekly: 150000,
          priceMonthly: 500000,
          isInstantBook: true,
          amenities: ['wifi', 'video_call_ok', 'phone_ok'] as AmenityType[],
          images: ['/uploads/spaces/mock_desk.png'],
        },
        {
          title: '힙지로 감성 을지로 복합문화 오피스 라운지',
          description: '을지로 특유의 뉴트로 감성 조명과 음악이 어우러진 크리에이티브 공간입니다. 업무와 영감을 동시에 채울 수 있는 자유로운 대화 분위기의 책상입니다.',
          address: '서울특별시 중구 을지로 100',
          addressSummary: '중구 을지로동',
          latitude: 37.5662,
          longitude: 126.9850,
          capacity: 6,
          priceDaily: 16000,
          priceWeekly: 95000,
          priceMonthly: 330000,
          isInstantBook: false,
          amenities: ['wifi', 'kitchen', 'printer'] as AmenityType[],
          images: ['/uploads/spaces/mock_cozy.png'],
        },
      ];

      // 3. 루프를 돌며 벌크 적재
      for (const mock of mockSpaces) {
        const space = this.spaceRepository.create({
          title: mock.title,
          description: mock.description,
          address: mock.address,
          addressSummary: mock.addressSummary,
          latitude: mock.latitude,
          longitude: mock.longitude,
          capacity: mock.capacity,
          priceDaily: mock.priceDaily,
          priceWeekly: mock.priceWeekly,
          priceMonthly: mock.priceMonthly,
          isInstantBook: mock.isInstantBook,
          hostId: host.id,
        });
        const savedSpace = await this.spaceRepository.save(space);

        // 편의시설 매핑
        const amenityEntities = mock.amenities.map(amenity =>
          this.amenityRepository.create({ spaceId: savedSpace.id, amenity })
        );
        await this.amenityRepository.save(amenityEntities);

        // 이미지 매핑
        const imageEntities = mock.images.map((url, idx) =>
          this.imageRepository.create({
            spaceId: savedSpace.id,
            url,
            isPrimary: idx === 0,
            sortOrder: idx,
          })
        );
        await this.imageRepository.save(imageEntities);
      }

      console.log('✅ [Binjari DB] Mock 공간 데이터 5종 적재 성공 완료!');
    } catch (err) {
      console.error('❌ [Binjari DB] Mock 데이터 적재 에러:', err);
    }
  }

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

    // 3. 이미지 정보가 주어지면 매핑하여 추가 저장
    if (dto.images && dto.images.length > 0) {
      const imageEntities = dto.images.map((url, idx) =>
        this.imageRepository.create({
          spaceId: savedSpace.id,
          url,
          isPrimary: idx === 0, // 첫 번째 이미지를 대표 이미지로 설정
          sortOrder: idx,
        }),
      );
      await this.imageRepository.save(imageEntities);
      
      // 이미지 목록 바인딩
      savedSpace.images = imageEntities;
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

  /**
   * 단일 오피스 공간 상세 조회
   */
  async findOneSpace(id: string): Promise<Space> {
    const space = await this.spaceRepository.findOne({
      where: { id },
      relations: {
        images: true,
        amenities: true,
      },
    });

    if (!space) {
      throw new NotFoundException('요청하신 공간 정보를 찾을 수 없습니다.');
    }

    return space;
  }
}
