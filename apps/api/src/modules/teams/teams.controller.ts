import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';

class CreateTeamDto {
  @IsString()
  name: string;

  @IsString()
  gameId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsNumber()
  capacity: number;

  @IsOptional()
  @IsDateString()
  slotDateTime?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'لیست تیم‌های در حال تشکیل' })
  async findAll(
    @Query('cityId') cityId?: string,
    @Query('gameId') gameId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.teamsService.findAll(
      cityId,
      gameId,
      Number(page),
      Number(limit),
    );
    return { success: true, ...result };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'جزئیات تیم' })
  async findOne(@Param('id') id: string) {
    const data = await this.teamsService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'ایجاد تیم جدید' })
  async create(@Body() dto: CreateTeamDto, @CurrentUser() user: any) {
    const data = await this.teamsService.create(user.id, dto);
    return { success: true, data };
  }

  @Post(':id/join')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'پیوستن به تیم' })
  async join(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.teamsService.join(id, user.id);
    return { success: true, data };
  }

  @Post(':id/leave')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'خروج از تیم' })
  async leave(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.teamsService.leave(id, user.id);
    return { success: true, data };
  }

  @Post(':id/kick/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'اخراج عضو (فقط کاپیتان)' })
  async kick(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.teamsService.kick(id, user.id, targetUserId);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف تیم (فقط کاپیتان)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.teamsService.delete(id, user.id);
    return { success: true, data };
  }
}
