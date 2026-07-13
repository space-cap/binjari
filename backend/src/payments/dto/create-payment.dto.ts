export class CreatePaymentDto {
  bookingId: string;
  paymentMethod: string; // 가상 결제 종류 (e.g., 'card', 'bank_transfer')
}
