import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * 이용 완료(confirmed) 예약 건 기반 한 줄 후기 및 별점 등록
   */
  async createReview(userId: string, dto: CreateReviewDto): Promise<Review> {
    // 1. 예약 조회
    const booking = await this.bookingRepository.findOne({ where: { id: dto.bookingId } });
    if (!booking) {
      throw new NotFoundException('리뷰 대상인 예약 내역을 찾을 수 없습니다.');
    }

    // 2. 소유권 체크
    if (booking.userId !== userId) {
      throw new ForbiddenException('본인이 이용 완료한 예약 건에만 리뷰를 남기실 수 있습니다.');
    }

    // 3. 예약 완료 상태 체크 (confirmed 상태일 때만 작성 가능)
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('아직 이용/결제 완료되지 않은 예약 건에는 리뷰를 작성할 수 없습니다.');
    }

    // 4. 중복 리뷰 작성 방지 (OneToOne 느낌으로 체크)
    const exists = await this.reviewRepository.count({ where: { bookingId: dto.bookingId } });
    if (exists > 0) {
      throw new BadRequestException('이미 해당 예약 내역에 대해 후기 별점을 등록하셨습니다.');
    }

    // 5. 별점 점수 범위 검사 (1~5점)
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('평점은 1점부터 5점 사이로만 부여할 수 있습니다.');
    }

    // 6. 리뷰 원장 생성 및 저장
    const review = this.reviewRepository.create({
      spaceId: booking.spaceId,
      userId,
      bookingId: dto.bookingId,
      rating: dto.rating,
      comment: dto.comment,
    });

    return this.reviewRepository.save(review);
  }

  /**
   * 특정 공간의 전체 후기 피드 목록 조회 (최근순)
   */
  async findSpaceReviews(spaceId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { spaceId },
      relations: {
        user: true, // 작성 유저 정보 조인
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 특정 공간의 평균 평점 및 리뷰 개수 집계 조회
   */
  async getSpaceStats(spaceId: string) {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.space_id = :spaceId', { spaceId })
      .getRawOne();

    const rawAvg = Number(result.avg || 0);
    const reviewCount = Number(result.count || 0);

    // 소수점 첫째짜리 포맷 (ex: 4.67 -> 4.7)
    const avgRating = parseFloat(rawAvg.toFixed(1));

    return {
      avgRating,
      reviewCount,
    };
  }
}
