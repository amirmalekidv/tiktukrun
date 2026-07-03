import {
  IsString, IsOptional, IsEmail, IsEnum, IsDateString,
  MaxLength, MinLength, Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const;

type Gender = (typeof GENDER)[keyof typeof GENDER];

export class UpdateMeDto {
  @ApiPropertyOptional({ description: 'نام و نام خانوادگی', example: 'علی محمدی' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ description: 'نام کاربری یونیک', example: 'ali_m' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_.-]+$/, { message: 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد، -، _ و . باشد' })
  nickname?: string;

  @ApiPropertyOptional({ description: 'ایمیل', example: 'ali@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'فرمت ایمیل صحیح نیست' })
  email?: string;

  @ApiPropertyOptional({ description: 'بیوگرافی', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'آیدی اینستاگرام' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  instagram?: string;

  @ApiPropertyOptional({ description: 'آیدی تلگرام' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  telegram?: string;

  @ApiPropertyOptional({ description: 'تاریخ تولد (ISO)', example: '2000-01-01' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: GENDER })
  @IsOptional()
  @IsEnum(GENDER)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'شناسه شهر' })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({ description: 'تنظیمات کاربر (JSON)' })
  @IsOptional()
  settings?: Record<string, any>;
}
