import { ApiProperty } from '@nestjs/swagger';

export class MetaDto {
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
  @ApiProperty({ example: 100 }) total: number;
  @ApiProperty({ example: 5 }) totalPages: number;
}

export class BaseResponseDto<T> {
  @ApiProperty({ example: true }) success: boolean;
  data: T;
  @ApiProperty({ required: false }) message?: string;
  @ApiProperty({ required: false, type: MetaDto }) meta?: MetaDto;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false }) success: boolean;
  @ApiProperty({ example: { code: 'NOT_FOUND', message: 'یافت نشد' } }) error: { code: string; message: string };
  @ApiProperty({ example: 404 }) statusCode: number;
}
