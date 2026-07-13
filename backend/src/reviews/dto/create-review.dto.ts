export class CreateReviewDto {
  bookingId: string;
  rating: number; // 1~5 정수 별점
  comment: string; // 한 줄 후기 내용
}
