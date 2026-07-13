import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Space } from '../spaces/entities/space.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Space)
    private readonly spaceRepository: Repository<Space>,
  ) {}

  /**
   * 실시간 가용 좌석 검증 및 예약 생성
   */
  async createBooking(userId: string, dto: CreateBookingDto): Promise<Booking> {
    // 1. 대여 대상 공간 조회
    const space = await this.spaceRepository.findOne({ where: { id: dto.spaceId } });
    if (!space) {
      throw new NotFoundException('대여하고자 하는 공간 정보를 찾을 수 없습니다.');
    }

    // 2. 예약석 범위 한도 체크 (최소 1석)
    if (dto.seatCount <= 0) {
      throw new ConflictException('최소 1석 이상 대여해 주셔야 합니다.');
    }

    // 3. 실시간 잔여 좌석 가용성 검사
    const targetDate = new Date(dto.checkInDate);
    
    const sumResult = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.seatCount)', 'sum')
      .where('booking.space_id = :spaceId', { spaceId: dto.spaceId })
      .andWhere('booking.check_in_date = :targetDate', { targetDate })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      })
      .getRawOne();

    const reservedSeats = Number(sumResult.sum || 0);
    const availableSeats = space.capacity - reservedSeats;

    if (reservedSeats + dto.seatCount > space.capacity) {
      throw new ConflictException(
        `선택하신 날짜에 예약 가능한 잔여 좌석이 부족합니다. (신청: ${dto.seatCount}석 / 예약가능: ${availableSeats}석)`,
      );
    }

    // 4. 총 요금 연산 (일 요금 * 대여석 수)
    const totalPrice = space.priceDaily * dto.seatCount;

    // 5. 예약 생성 및 저장
    const booking = this.bookingRepository.create({
      spaceId: dto.spaceId,
      userId,
      checkInDate: targetDate,
      seatCount: dto.seatCount,
      totalPrice,
      status: BookingStatus.PENDING, // 기본 상태 대기
    });

    return this.bookingRepository.save(booking);
  }

  /**
   * 게스트 계정의 내 예약 목록 조회 (최근 순 정렬)
   */
  async findMyBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { userId },
      relations: {
        space: {
          images: true,
        },
        review: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 예약 취소 및 어뷰징 차단 필터
   */
  async cancelBooking(userId: string, bookingId: string): Promise<Booking> {
    // 1. 예약 로드
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('취소 대상인 예약 정보를 찾을 수 없습니다.');
    }

    // 2. 본인 소유권 검사
    if (booking.userId !== userId) {
      throw new ForbiddenException('본인의 예약 내역만 취소하실 수 있습니다.');
    }

    // 3. 이미 취소 상태인 경우 중복 취소 차단
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('이미 취소 처리 완료된 예약 건입니다.');
    }

    // 4. 과거 및 당일 이용 시점 검사
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(booking.checkInDate);
    if (bookingDate < today) {
      throw new BadRequestException('이용일이 시작되었거나 이미 지난 예약은 취소하실 수 없습니다.');
    }

    // 5. 일일 예약 취소 횟수(최대 5회) 제한 검사 (어뷰징 가드)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCancelCount = await this.bookingRepository.count({
      where: {
        userId,
        status: BookingStatus.CANCELLED,
        updatedAt: MoreThanOrEqual(startOfDay),
      },
    });

    if (todayCancelCount >= 5) {
      throw new BadRequestException(
        '하루에 취소 가능한 최대 횟수(5회)를 초과하여 임시 차단되었습니다. 고객센터에 문의해 주세요.',
      );
    }

    // 6. 취소 완료 처리
    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }
}
