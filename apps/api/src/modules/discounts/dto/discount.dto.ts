import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum DiscountType {
  PERCENT = 'PERCENT',
  FIXED   = 'FIXED',
}

export enum AutoDiscountRule {
  VIP           = 'VIP',
  WEEKLY        = 'WEEKLY',
  FIRST_BOOKING = 'FIRST_BOOKING',
  BIRTHDAY      = 'BIRTHDAY',
  INVITE        = 'INVITE',
}

export class ValidateDiscountDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  gameId: string;

  @Transform(({ value, obj }) => value ?? obj.players)
  @IsInt()
  @Type(() => Number)
  playersCount: number;

  @Transform(({ value, obj }) => value ?? obj.slotId)
  @IsDateString()
  slotDateTime: string;
}

export class CreateDiscountCodeDto {
  @IsString()
  code: string;

  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNumber() @Type(() => Number)
  value: number;                   // درصد یا مبلغ تومان

  @IsOptional() @IsNumber() @Type(() => Number)
  minPurchase?: number;

  @IsOptional() @IsNumber() @Type(() => Number)
  maxDiscount?: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsOptional() @IsInt() @Type(() => Number) @Min(1)
  maxUses?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  gameIds?: string[];

  @IsOptional() @IsString()
  targetSegmentId?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateDiscountCodeDto {
  @IsOptional() @IsEnum(DiscountType)
  type?: DiscountType;

  @IsOptional() @IsNumber() @Type(() => Number)
  value?: number;

  @IsOptional() @IsNumber() @Type(() => Number)
  minPurchase?: number;

  @IsOptional() @IsNumber() @Type(() => Number)
  maxDiscount?: number;

  @IsOptional() @IsDateString()
  validFrom?: string;

  @IsOptional() @IsDateString()
  validUntil?: string;

  @IsOptional() @IsInt() @Type(() => Number)
  maxUses?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class CreateAutoDiscountDto {
  @IsString()
  name: string;

  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNumber() @Type(() => Number)
  value: number;

  @IsEnum(AutoDiscountRule)
  ruleType: AutoDiscountRule;

  @IsOptional()
  conditions?: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateAutoDiscountDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsEnum(DiscountType)
  type?: DiscountType;

  @IsOptional() @IsNumber() @Type(() => Number)
  value?: number;

  @IsOptional()
  conditions?: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
