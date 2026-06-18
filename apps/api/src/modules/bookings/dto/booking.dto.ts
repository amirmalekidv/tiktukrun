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
