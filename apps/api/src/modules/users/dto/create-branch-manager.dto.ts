import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { normalizeMobile } from '../../../common/utils/persian-num';

export class CreateBranchManagerDto {
  @ApiProperty({ example: '09121234567', description: 'شماره موبایل (الزامی)' })
  @Transform(({ value }) => normalizeMobile(String(value ?? '')))
  @IsString()
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  mobile: string;

  @ApiProperty({ example: 'علی رضایی', description: 'نام و نام‌خانوادگی' })
  @IsString()
  @IsNotEmpty({ message: 'نام الزامی است' })
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) => String(value ?? '').trim())
  fullName: string;

  @ApiProperty({ example: '664f1a2b3c4d5e6f7a8b9c0d', description: 'شناسه شعبه تحت مدیریت' })
  @IsString()
  @IsNotEmpty({ message: 'انتخاب شعبه الزامی است' })
  branchId: string;

  @ApiPropertyOptional({ example: 'manager@branch.local' })
  @IsOptional()
  @Transform(({ value }) => {
    const v = String(value ?? '').trim();
    return v.length ? v : undefined;
  })
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  email?: string;
}
