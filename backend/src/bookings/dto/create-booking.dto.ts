export class CreateBookingDto {
  spaceId: string;
  checkInDate: string; // ISO Date String (e.g., '2026-07-15')
  seatCount: number;
}
