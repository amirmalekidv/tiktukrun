import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';
import { TicketsService } from '../tickets/tickets.service';

class ContactFormDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  subject: string;

  @IsString()
  @MinLength(10)
  message: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('contact')
  @Public()
  @ApiOperation({ summary: 'فرم تماس عمومی — ایجاد تیکت سیستمی' })
  async submitContact(@Body() dto: ContactFormDto) {
    const data = await this.ticketsService.createPublicContactTicket(dto);
    return { success: true, data };
  }
}
