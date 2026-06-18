import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum GameGenre {
  HORROR     = 'HORROR',
  NON_HORROR = 'NON_HORROR',
}

export enum GameSortBy {
  POPULAR    = 'popular',
  NEWEST     = 'newest',
  RATING     = 'rating',
  PRICE_ASC  = 'price-asc',
  PRICE_DESC = 'price-desc',
}

export class GameQueryDto {
  @IsOptional() @IsString()  cityId?:       string;
  @IsOptional() @IsString()  branchId?:     string;
  @IsOptional() @IsString()  categoryId?:   string;
  @IsOptional() @IsString()  categorySlug?: string;

  @IsOptional() @IsEnum(GameGenre)
  genre?: GameGenre;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10)
  minFear?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10)
  maxFear?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  maxPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  minPlayers?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  maxPlayers?: number;

  @IsOptional() @IsString()
  tags?: string; // CSV

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  weeklyDiscount?: boolean;

  @IsOptional() @IsString()
  q?: string; // full-text search

  @IsOptional() @IsEnum(GameSortBy)
  sortBy?: GameSortBy;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}

export class GameSectionDto {
  section!:
    | 'weekly-discount'
    | 'cinema-horror'
    | 'board-games'
    | 'laser-tag'
    | 'vr'
    | 'tehran'
    | 'karaj'
    | 'horror'
    | 'non-horror'
    | 'popular-this-week';
}
