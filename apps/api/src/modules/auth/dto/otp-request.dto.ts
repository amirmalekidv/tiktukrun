import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { normalizeMobile } from '../../../common/utils/persian-num';

export class OtpRequestDto {
  @ApiProperty({
    description: 'شماره موبایل ایرانی',
    example: '09123456789',
  })
  @IsString()
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Transform(({ value }) => normalizeMobile(value))
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره موبایل صحیح نیست' })
  mobile: string;
}
