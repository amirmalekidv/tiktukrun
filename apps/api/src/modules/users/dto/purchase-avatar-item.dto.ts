import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseAvatarItemDto {
  @ApiProperty({ description: 'شناسه آیتم آواتار' })
  @IsString()
  @IsNotEmpty()
  itemId: string;
}
