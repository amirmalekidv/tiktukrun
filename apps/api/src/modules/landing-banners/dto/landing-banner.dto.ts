import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
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

export class CreateLandingBannerDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() altText?: string;
  @IsOptional() @IsString() href?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @Transform(({ value }) => toBoolean(value)) @IsBoolean() isActive?: boolean;
}

export class UpdateLandingBannerDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() altText?: string;
  @IsOptional() @IsString() href?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @Transform(({ value }) => toBoolean(value)) @IsBoolean() isActive?: boolean;
}

export class ReorderLandingBannersDto {
  @IsArray() @IsString({ each: true }) bannerIds!: string[];
}
