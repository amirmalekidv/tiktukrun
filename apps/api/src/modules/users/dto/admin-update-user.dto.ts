import { IsOptional, IsBoolean, IsString, IsArray, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const USER_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  SUPPORT: 'SUPPORT',
  MARKETING: 'MARKETING',
  CUSTOMER: 'CUSTOMER',
} as const;

type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ description: 'وضعیت بن' })
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;

  @ApiPropertyOptional({ description: 'دلیل بن' })
  @IsOptional()
  @IsString()
  banReason?: string;

  @ApiPropertyOptional({ description: 'وضعیت سکوت' })
  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;

  @ApiPropertyOptional({ description: 'نقش‌های کاربر', type: [String], enum: USER_ROLE })
  @IsOptional()
  @IsArray()
  @IsEnum(USER_ROLE, { each: true })
  roles?: UserRole[];

  @ApiPropertyOptional({ description: 'سطح دستی', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  level?: number;
}

export class AdjustXpDto {
  @ApiPropertyOptional({ description: 'تغییر XP (مثبت یا منفی)' })
  @IsInt()
  delta: number;

  @ApiPropertyOptional({ description: 'دلیل تغییر' })
  @IsString()
  reason: string;
}

export class AdjustWalletDto {
  @ApiPropertyOptional({ description: 'نوع ارز', enum: ['TOMAN', 'COINS', 'DIAMONDS', 'XP'] })
  @IsString()
  @IsEnum(['TOMAN', 'COINS', 'DIAMONDS', 'XP'])
  currency: 'TOMAN' | 'COINS' | 'DIAMONDS' | 'XP';

  @ApiPropertyOptional({ description: 'مقدار (مثبت = شارژ، منفی = کسر)' })
  @IsInt()
  delta: number;

  @ApiPropertyOptional({ description: 'دلیل تغییر' })
  @IsString()
  reason: string;
}

export class GrantBadgeDto {
  @ApiPropertyOptional({ description: 'کد بج' })
  @IsString()
  badgeCode: string;

  @ApiPropertyOptional({ description: 'دلیل اعطای بج' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BanUserDto {
  @ApiPropertyOptional({ description: 'دلیل مسدودسازی' })
  @IsString()
  reason: string;
}

export class MuteUserDto {
  @ApiPropertyOptional({ description: 'مدت سکوت به ساعت' })
  @IsInt()
  @Min(1)
  @Max(8760)
  hours: number;

  @ApiPropertyOptional({ description: 'دلیل سکوت' })
  @IsString()
  reason: string;
}
