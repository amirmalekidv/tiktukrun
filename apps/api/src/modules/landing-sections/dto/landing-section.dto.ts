import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LandingSectionFilterType } from '@prisma/client';

export class CreateLandingSectionDto {
  @IsString() key!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsEnum(LandingSectionFilterType) filterType!: LandingSectionFilterType;
  @IsOptional() @IsString() categorySlug?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) categorySlugs?: string[];
  @IsOptional() @IsString() citySlug?: string;
  @IsOptional() @IsString() tagFilter?: string;
}

export class UpdateLandingSectionDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsEnum(LandingSectionFilterType) filterType?: LandingSectionFilterType;
  @IsOptional() @IsString() categorySlug?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) categorySlugs?: string[];
  @IsOptional() @IsString() citySlug?: string;
  @IsOptional() @IsString() tagFilter?: string;
}

export class SetLandingSectionGamesDto {
  @IsArray() @IsString({ each: true }) gameIds!: string[];
}
