import {
  IsString,
  IsDateString,
  IsInt,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  WALLET   = 'WALLET',
  ZARINPAL = 'ZARINPAL',
}

export enum BookingStatus {
  PENDING   = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  REFUNDED  = 'REFUNDED',
}

export class BookingPreviewDto {
  @IsString()
  gameId: string;

  @IsDateString()
  slotDateTime: string;

  @IsInt() @Type(() => Number) @Min(1)
  playersCount: number;

  @IsOptional() @IsString()
  discountCode?: string;
}

export class CreateBookingDto {
  @IsString()
  gameId: string;

  @IsDateString()
  slotDateTime: string;

  @IsInt() @Type(() => Number) @Min(1)
  playersCount: number;

  @IsOptional() @IsString()
  discountCode?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional() @IsString()
  note?: string;
}

export class CancelBookingDto {
  @IsOptional() @IsString()
  reason?: string;
}

// Manual (admin/POS) booking creation. The admin records a booking on behalf
// of a customer (walk-in / phone reservation). Payment is recorded as already
// settled with the chosen method; the wallet flow is intentionally bypassed.
export enum AdminPaymentMethod {
  CASH          = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET        = 'WALLET',
  ZARINPAL      = 'ZARINPAL',
}

export class AdminCreateBookingDto {
  @IsString()
  userId: string;

  @IsString()
  gameId: string;

  @IsDateString()
  slotDateTime: string;

  @IsInt() @Type(() => Number) @Min(1)
  playersCount: number;

  @IsEnum(AdminPaymentMethod)
  paymentMethod: AdminPaymentMethod;

  // Optional manual override of the per-booking total (Toman). When omitted,
  // it is computed from the game's pricePerPerson × playersCount.
  @IsOptional() @IsInt() @Type(() => Number) @Min(0)
  totalAmount?: number;

  @IsOptional() @IsString()
  note?: string;
}

export class AdminUpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @IsOptional() @IsString()
  reason?: string;
}

export class RefundBookingDto {
  @IsNumber() @Type(() => Number) @Min(0)
  amount: number;

  @IsString()
  reason: string;
}

export class RatePlayerDto {
  @IsInt() @Type(() => Number)
  xpDelta: number;

  @IsString()
  reason: string;
}

export class BookingQueryDto {
  @IsOptional() @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional() @IsString()
  userId?: string;

  @IsOptional() @IsString()
  gameId?: string;

  @IsOptional() @IsString()
  branchId?: string;

  @IsOptional() @IsDateString()
  from?: string;

  @IsOptional() @IsDateString()
  to?: string;

  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
