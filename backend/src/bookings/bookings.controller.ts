import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * POST /v1/bookings
   * 실시간 오피스 좌석 예약 신청 (로그인 유저 전용)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: User,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user.id, createBookingDto);
  }

  /**
   * GET /v1/bookings/my
   * 로그인한 유저 본인의 전체 예약 내역 조회
   */
  @Get('my')
  @HttpCode(HttpStatus.OK)
  async findMyBookings(@CurrentUser() user: User) {
    return this.bookingsService.findMyBookings(user.id);
  }

  /**
   * POST /v1/bookings/:id/cancel
   * 본인의 예약 취소 요청 (로그인 유저 전용 + 안티 어뷰징)
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser() user: User,
    @Param('id') bookingId: string,
  ) {
    return this.bookingsService.cancelBooking(user.id, bookingId);
  }
}
