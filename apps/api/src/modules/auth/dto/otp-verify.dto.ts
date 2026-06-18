import { IsString, IsNotEmpty, Matches, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { normalizeMobile, toEnglishDigits } from '../../../common/utils/persian-num';

export class OtpVerifyDto {
  @ApiProperty({
    description: 'شماره موبایل ایرانی',
    example: '09123456789',
  })
  @IsString()
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Transform(({ value }) => normalizeMobile(value))
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره موبایل صحیح نیست' })
  mobile: string;

  @ApiProperty({
    description: 'کد یکبار مصرف ۵ رقمی',
    example: '12345',
  })
  @IsString()
  @IsNotEmpty({ message: 'کد تأیید الزامی است' })
  @Transform(({ value }) => toEnglishDigits(value))
  @Matches(/^\d{5}$/, { message: 'کد تأیید باید ۵ رقم باشد' })
  code: string;

  @ApiPropertyOptional({
    description: 'کد دعوت (اختیاری)',
    example: 'ABC12345',
  })
  @IsOptional()
  @IsString()
  @Length(4, 20, { message: 'کد دعوت باید بین ۴ تا ۲۰ کاراکتر باشد' })
  inviteCode?: string;
}
