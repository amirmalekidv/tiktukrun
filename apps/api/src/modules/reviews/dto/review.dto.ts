import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsInt() @Type(() => Number) @Min(1) @Max(5)
  rating: number;

  @IsOptional() @IsString() @MinLength(5)
  text?: string;
}

export class UpdateReviewDto {
  @IsOptional() @IsInt() @Type(() => Number) @Min(1) @Max(5)
  rating?: number;

  @IsOptional() @IsString() @MinLength(5)
  text?: string;
}

export class RejectReviewDto {
  @IsString()
  reason: string;
}
