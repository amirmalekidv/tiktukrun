import { IsString, IsNotEmpty, IsInt, Min, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChargeWalletDto {
  @ApiProperty({ description: 'مبلغ به تومان', minimum: 10000, example: 100000 })
  @IsInt()
  @Min(10000, { message: 'حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است' })
  amount: number;

  @ApiProperty({ description: 'درگاه پرداخت', enum: ['ZARINPAL'], example: 'ZARINPAL' })
  @IsString()
  @IsEnum(['ZARINPAL'])
  method: 'ZARINPAL';
}

export class PurchaseDiamondsDto {
  @ApiProperty({ description: 'شناسه بسته الماس', example: 'pkg_50' })
  @IsString()
  @IsNotEmpty()
  packageId: string;
}

export class PurchaseCoinsDto {
  @ApiProperty({ description: 'شناسه بسته سکه', example: 'coin_100' })
  @IsString()
  @IsNotEmpty()
  packageId: string;
}

export class ConvertCurrencyDto {
  @ApiProperty({ description: 'ارز مبدا', enum: ['XP'], example: 'XP' })
  @IsString()
  @IsEnum(['XP'])
  from: 'XP';

  @ApiProperty({ description: 'ارز مقصد', enum: ['COINS'], example: 'COINS' })
  @IsString()
  @IsEnum(['COINS'])
  to: 'COINS';

  @ApiProperty({ description: 'مقدار تبدیل', minimum: 1, example: 100 })
  @IsInt()
  @Min(1)
  amount: number;
}

export class ManualAdjustDto {
  @ApiProperty({ description: 'شناسه کاربر' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'نوع ارز', enum: ['TOMAN', 'COINS', 'DIAMONDS', 'XP'] })
  @IsString()
  @IsEnum(['TOMAN', 'COINS', 'DIAMONDS', 'XP'])
  currency: 'TOMAN' | 'COINS' | 'DIAMONDS' | 'XP';

  @ApiProperty({ description: 'مقدار (مثبت یا منفی)', example: 10000 })
  @IsInt()
  delta: number;

  @ApiProperty({ description: 'دلیل تنظیم', example: 'شارژ دستی' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class WalletTransactionQueryDto {
  @ApiPropertyOptional({ description: 'صفحه', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'تعداد در صفحه', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'نوع ارز', enum: ['TOMAN', 'COINS', 'DIAMONDS', 'XP'] })
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'نوع تراکنش', enum: ['CREDIT', 'DEBIT', 'ADJUSTMENT'] })
  @IsOptional()
  type?: string;
}
