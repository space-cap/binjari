import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * 가상 결제 승인 처리 및 예약 상태 확정(confirmed) 승격
   */
  async createPayment(userId: string, dto: CreatePaymentDto): Promise<Payment> {
    // 1. 결제 대상 예약 조회
    const booking = await this.bookingRepository.findOne({ where: { id: dto.bookingId } });
    if (!booking) {
      throw new NotFoundException('결제 대상인 예약 정보를 찾을 수 없습니다.');
    }

    // 2. 예약 소유자 검증 (본인 예약만 결제 가능)
    if (booking.userId !== userId) {
      throw new BadRequestException('본인의 예약 내역만 결제하실 수 있습니다.');
    }

    // 3. 중복 결제 방어 (상태가 대기중인 pending 상태일 때만 결제 가동)
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `결제할 수 없는 예약 상태입니다. (현재 예약 상태: ${booking.status})`,
      );
    }

    // 4. 결제 원장 생성 및 저장
    const payment = this.paymentRepository.create({
      bookingId: dto.bookingId,
      amount: booking.totalPrice,
      paymentMethod: dto.paymentMethod,
      status: 'success',
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // 5. 대상 예약 상태를 "확정(confirmed)" 상태로 자동 승격 갱신
    booking.status = BookingStatus.CONFIRMED;
    await this.bookingRepository.save(booking);

    // 관계 매핑과 함께 결제 데이터 반환
    savedPayment.booking = booking;
    return savedPayment;
  }
}
