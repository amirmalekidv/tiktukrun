import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateInviteDto {
  @ApiProperty({ description: 'کد دعوت', example: 'ABC12345' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  code: string;
}

export class ApplyInviteDto {
  @ApiProperty({ description: 'کد دعوت', example: 'ABC12345' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  code: string;
}
