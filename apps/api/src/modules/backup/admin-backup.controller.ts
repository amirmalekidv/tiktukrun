import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsString } from 'class-validator';

class RestoreBackupDto {
  @IsString()
  filename: string;

  @IsString()
  confirmToken: string;
}

@ApiTags('Admin - Backup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin/backup')
export class AdminBackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  @ApiOperation({ summary: 'ایجاد پشتیبان کامل (mongodump --archive --gzip)' })
  async createBackup() {
    const result = await this.backupService.createBackup();
    return { success: true, data: result };
  }

  @Get('list')
  @ApiOperation({ summary: 'لیست فایل‌های پشتیبان' })
  async listBackups() {
    const data = this.backupService.listBackups();
    return { success: true, data };
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'دانلود فایل پشتیبان' })
  async downloadBackup(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filepath = this.backupService.getBackupPath(filename);
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.sendFile(filepath, (err) => {
      if (err) {
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'خطا در دانلود فایل' });
        }
      }
    });
  }

  @Post('restore')
  @ApiOperation({
    summary: 'بازیابی از پشتیبان (نیاز به confirmToken برابر نام فایل)',
  })
  async restoreBackup(@Body() dto: RestoreBackupDto) {
    const data = await this.backupService.restoreBackup(
      dto.filename,
      dto.confirmToken,
    );
    return { success: true, data };
  }

  @Delete(':filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'حذف فایل پشتیبان' })
  async deleteBackup(@Param('filename') filename: string) {
    this.backupService.deleteBackup(filename);
  }
}
