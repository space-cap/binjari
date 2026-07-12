import { AmenityType } from '../entities/space-amenity.entity';

export class CreateSpaceDto {
  title: string;
  description: string;
  address: string;
  addressSummary: string;
  latitude: number;
  longitude: number;
  capacity: number;
  priceDaily?: number;
  priceWeekly?: number;
  priceMonthly?: number;
  isInstantBook?: boolean;
  amenities?: AmenityType[];
}
