import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
