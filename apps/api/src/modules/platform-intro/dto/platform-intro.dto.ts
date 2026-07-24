import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

function toBoolean(value: unknown) {
  if (value === true || value === false) return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return value;
}

export class UpdatePlatformIntroDto {
  @IsOptional() @IsString() @MinLength(1) title?: string;
  @IsOptional() @IsString() @MinLength(1) faqTitle?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @Transform(({ value }) => toBoolean(value)) @IsBoolean() isActive?: boolean;
  /** وقتی true باشد ویدیوی فعلی حذف می‌شود */
  @IsOptional() @Transform(({ value }) => toBoolean(value)) @IsBoolean() clearVideo?: boolean;
}

export class CreatePlatformFaqDto {
  @IsString() @MinLength(1) question!: string;
  @IsString() @MinLength(1) answer!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @Transform(({ value }) => toBoolean(value)) @IsBoolean() isActive?: boolean;
}

export class UpdatePlatformFaqDto {
  @IsOptional() @IsString() @MinLength(1) question?: string;
  @IsOptional() @IsString() @MinLength(1) answer?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @Transform(({ value }) => toBoolean(value)) @IsBoolean() isActive?: boolean;
}

export class ReorderPlatformFaqsDto {
  @IsArray() @IsString({ each: true }) faqIds!: string[];
}
