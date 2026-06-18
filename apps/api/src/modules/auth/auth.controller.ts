import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth — احراز هویت')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'درخواست کد OTP', description: 'ارسال کد تأیید به شماره موبایل' })
  @ApiResponse({ status: 200, description: 'کد ارسال شد' })
  @ApiResponse({ status: 429, description: 'تعداد درخواست بیش از حد' })
  async requestOtp(@Body() dto: OtpRequestDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
    const result = await this.authService.requestOtp(dto.mobile, ipAddress);
    return {
      success: true,
      data: result,
      message: `کد تأیید به ${dto.mobile} ارسال شد`,
    };
  }

  @Post('otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تأیید کد OTP و ورود/ثبت‌نام', description: 'تأیید کد و دریافت توکن‌ها' })
  @ApiResponse({ status: 200, description: 'احراز هویت موفق' })
  @ApiResponse({ status: 400, description: 'کد نامعتبر یا منقضی' })
  async verifyOtp(@Body() dto: OtpVerifyDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
    const deviceInfo = req.get('user-agent');
    const result = await this.authService.verifyOtp(
      dto.mobile,
      dto.code,
      dto.inviteCode,
      ipAddress,
      deviceInfo,
    );
    return {
      success: true,
      data: result,
      message: result.isNewUser ? 'ثبت‌نام با موفقیت انجام شد' : 'ورود موفق',
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تجدید توکن', description: 'دریافت access token جدید با refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const result = await this.authService.refreshToken(dto.refreshToken, ipAddress);
    return {
      success: true,
      data: result,
      message: 'توکن با موفقیت تجدید شد',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'خروج', description: 'باطل کردن نشست فعلی' })
  async logout(@CurrentUser('sessionId') sessionId: string) {
    const result = await this.authService.logout(sessionId);
    return { success: true, data: result };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'اطلاعات کاربر فعلی', description: 'دریافت پروفایل + کیف پول + مجوزها' })
  async getMe(@CurrentUser('id') userId: string) {
    const result = await this.authService.getMe(userId);
    return { success: true, data: result };
  }

  @Post('admin/login')
  @Public()
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ورود ادمین با رمز عبور' })
  @ApiBody({ type: AdminLoginDto })
  async adminLogin(@Req() req: any) {
    const ipAddress = req.ip;
    const deviceInfo = req.get('user-agent');
    const result = await this.authService.adminLogin(req.user, ipAddress, deviceInfo);
    return { success: true, data: result, message: 'ورود ادمین موفق' };
  }
}
