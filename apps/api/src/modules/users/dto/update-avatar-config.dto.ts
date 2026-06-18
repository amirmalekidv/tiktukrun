import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAvatarConfigDto {
  @ApiPropertyOptional({ description: 'شناسه کلاه' })
  @IsOptional()
  @IsString()
  hatId?: string;

  @ApiPropertyOptional({ description: 'شناسه عینک' })
  @IsOptional()
  @IsString()
  glassesId?: string;

  @ApiPropertyOptional({ description: 'شناسه رنگ پوست' })
  @IsOptional()
  @IsString()
  skinId?: string;

  @ApiPropertyOptional({ description: 'شناسه جلوه ویژه' })
  @IsOptional()
  @IsString()
  effectId?: string;

  @ApiPropertyOptional({ description: 'شناسه پس‌زمینه' })
  @IsOptional()
  @IsString()
  backgroundId?: string;
}
