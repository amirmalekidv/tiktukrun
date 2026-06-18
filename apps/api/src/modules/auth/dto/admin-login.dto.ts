import { IsString, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { normalizeMobile } from '../../../common/utils/persian-num';

export class AdminLoginDto {
  @ApiProperty({
    description: 'شماره موبایل ادمین',
    example: '09100000000',
  })
  @IsString()
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Transform(({ value }) => normalizeMobile(value))
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره موبایل صحیح نیست' })
  mobile: string;

  @ApiProperty({
    description: 'رمز عبور',
    example: 'Admin@123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'رمز عبور الزامی است' })
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' })
  password: string;
}
