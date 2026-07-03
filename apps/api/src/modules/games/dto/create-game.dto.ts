import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum GameGenreEnum {
  HORROR     = 'HORROR',
  NON_HORROR = 'NON_HORROR',
}

export enum GameTierEnum {
  STANDARD = 'STANDARD',
  SILVER   = 'SILVER',
  GOLD     = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND  = 'DIAMOND',
}

export class CreateGameDto {
  @IsString() @MinLength(2)
  title: string;

  @IsOptional() @IsString()
  subtitle?: string;

  @IsString()
  categoryId: string;

  @IsString()
  branchId: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  scenario?: string;

  @IsOptional() @IsEnum(GameGenreEnum)
  genre?: GameGenreEnum;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10)
  fearLevel?: number;

  @IsOptional() @IsString()
  difficulty?: string;

  @IsOptional() @IsEnum(GameTierEnum)
  tier?: GameTierEnum;

  @Type(() => Number) @IsInt() @Min(1)
  minPlayers: number;

  @Type(() => Number) @IsInt() @Min(1)
  maxPlayers: number;

  @Transform(({ obj, value }) => {
    const raw = value ?? obj?.duration;
    return raw !== undefined && raw !== '' ? Number(raw) : undefined;
  })
  @Type(() => Number) @IsInt() @Min(15)
  durationMinutes: number;

  @Type(() => Number) @IsNumber()
  pricePerPerson: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* comma-separated fallback */
    }
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  })
  tags?: string[];

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isFeatured?: boolean;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(50)
  weeklyDiscountPercent?: number;
}

export class UpdateGameDto {
  @IsOptional() @IsString() @MinLength(2)
  title?: string;

  @IsOptional() @IsString()
  subtitle?: string;

  @IsOptional() @IsString()
  slug?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsString()
  branchId?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  scenario?: string;

  @IsOptional() @IsEnum(GameGenreEnum)
  genre?: GameGenreEnum;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10)
  fearLevel?: number;

  @IsOptional() @IsString()
  difficulty?: string;

  @IsOptional() @IsEnum(GameTierEnum)
  tier?: GameTierEnum;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  minPlayers?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  maxPlayers?: number;

  @Transform(({ obj, value }) => {
    const raw = value ?? obj?.duration;
    return raw !== undefined && raw !== '' ? Number(raw) : undefined;
  })
  @IsOptional() @Type(() => Number) @IsInt() @Min(15)
  durationMinutes?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  pricePerPerson?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  siteRank?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* comma-separated fallback */
    }
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  })
  tags?: string[];

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isFeatured?: boolean;

  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(50)
  weeklyDiscountPercent?: number;

  @IsOptional() @IsString()
  teaserUrl?: string;
}

export class WeeklyDiscountDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(50)
  percent: number;
}
