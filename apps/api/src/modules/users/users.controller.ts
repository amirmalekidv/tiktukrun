import {
  Controller, Get, Patch, Post, Body, Param, Query,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Role } from '@tiktakrun/shared-types';
import { UsersService } from './users.service';
import { AvatarService } from './avatar.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateAvatarConfigDto } from './dto/update-avatar-config.dto';
import { PurchaseAvatarItemDto } from './dto/purchase-avatar-item.dto';
import {
  AdminUpdateUserDto, AdjustXpDto, AdjustWalletDto, GrantBadgeDto, BanUserDto, MuteUserDto,
} from './dto/admin-update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

// ─── User Controller ──────────────────────────────────────────────────────────

@ApiTags('Users — کاربران')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly avatarService: AvatarService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'اطلاعات کامل پروفایل کاربر' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'به‌روزرسانی پروفایل' })
  async updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(userId, dto);
  }

  @Post('me/avatar/upload')
  @ApiOperation({ summary: 'آپلود تصویر آواتار' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.avatarService.uploadAvatar(userId, file);
  }

  @Patch('me/avatar/config')
  @ApiOperation({ summary: 'تنظیم آیتم‌های آواتار' })
  async updateAvatarConfig(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAvatarConfigDto,
  ) {
    return this.avatarService.updateAvatarConfig(userId, dto);
  }

  @Get('me/avatar/config')
  @ApiOperation({ summary: 'دریافت تنظیمات آواتار' })
  async getAvatarConfig(@CurrentUser('id') userId: string) {
    return this.avatarService.getAvatarConfig(userId);
  }

  @Post('me/avatar/purchase')
  @ApiOperation({ summary: 'خرید آیتم آواتار با الماس' })
  async purchaseAvatarItem(
    @CurrentUser('id') userId: string,
    @Body() dto: PurchaseAvatarItemDto,
  ) {
    return this.avatarService.purchaseAvatarItem(userId, dto);
  }

  @Get('me/avatar/items')
  @ApiOperation({ summary: 'لیست آیتم‌های آواتار با وضعیت' })
  async getAvatarItems(@CurrentUser('id') userId: string) {
    return this.avatarService.getAvatarItems(userId);
  }
}

// ─── Admin Controller ─────────────────────────────────────────────────────────

@ApiTags('Admin — Users')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'لیست کاربران با فیلتر' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'banned', 'muted'] })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  async listUsers(@Query() query: any) {
    return this.usersService.adminListUsers(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'آمار کلی کاربران' })
  async getStats() {
    return this.usersService.adminGetStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات کامل کاربر' })
  async getUser(@Param('id') id: string) {
    return this.usersService.adminGetUser(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'به‌روزرسانی کاربر توسط ادمین' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.adminUpdateUser(id, dto, adminId);
  }

  @Post(':id/grant-badge')
  @ApiOperation({ summary: 'اعطای بج به کاربر' })
  async grantBadge(
    @Param('id') id: string,
    @Body() dto: GrantBadgeDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.adminGrantBadge(id, dto, adminId);
  }

  @Post(':id/revoke-badge')
  @ApiOperation({ summary: 'گرفتن بج از کاربر' })
  async revokeBadge(
    @Param('id') id: string,
    @Body() dto: GrantBadgeDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.adminRevokeBadge(id, dto, adminId);
  }

  @Post(':id/adjust-xp')
  @ApiOperation({ summary: 'تنظیم دستی XP کاربر' })
  async adjustXp(
    @Param('id') id: string,
    @Body() dto: AdjustXpDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.adminAdjustXp(id, dto, adminId);
  }

  @Post(':id/adjust-wallet')
  @ApiOperation({ summary: 'تنظیم دستی کیف پول کاربر' })
  async adjustWallet(
    @Param('id') id: string,
    @Body() dto: AdjustWalletDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.adminAdjustWallet(id, dto, adminId);
  }

  @Post(':id/ban')
  @ApiOperation({ summary: 'مسدودسازی کاربر' })
  async banUser(
    @Param('id') id: string,
    @Body() dto: BanUserDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.adminBanUser(id, dto, adminId);
  }

  @Post(':id/unban')
  @ApiOperation({ summary: 'رفع مسدودیت کاربر' })
  async unbanUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.usersService.adminUnbanUser(id, adminId);
  }

  @Post(':id/mute')
  @ApiOperation({ summary: 'سکوت کاربر' })
  async muteUser(
    @Param('id') id: string,
    @Body() dto: MuteUserDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.adminMuteUser(id, dto, adminId);
  }

  @Post(':id/unmute')
  @ApiOperation({ summary: 'رفع سکوت کاربر' })
  async unmuteUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.usersService.adminUnmuteUser(id, adminId);
  }
}
