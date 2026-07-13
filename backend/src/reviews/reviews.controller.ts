import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * POST /v1/reviews
   * 오피스 이용 완료 예약 건 별점 평점 및 후기 생성 (로그인 게스트 전용)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: User,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.id, createReviewDto);
  }

  /**
   * GET /v1/reviews/space/:spaceId
   * 특정 공간에 쌓인 전체 리뷰 목록 조회
   */
  @Get('space/:spaceId')
  @HttpCode(HttpStatus.OK)
  async findReviews(@Param('spaceId') spaceId: string) {
    return this.reviewsService.findSpaceReviews(spaceId);
  }

  /**
   * GET /v1/reviews/space/:spaceId/stats
   * 특정 공간의 평균 평점 및 리뷰 개수 요약 정보 조회
   */
  @Get('space/:spaceId/stats')
  @HttpCode(HttpStatus.OK)
  async getStats(@Param('spaceId') spaceId: string) {
    return this.reviewsService.getSpaceStats(spaceId);
  }
}
