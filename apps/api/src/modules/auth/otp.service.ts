import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { SettingsService } from '../settings/settings.service';
import { generateOtpCode, hashString, compareHash } from '../../common/utils/crypto';

const DEFAULT_OTP_TTL_SECONDS = 120;
const DEFAULT_RATE_LIMIT_COUNT = 3;
const DEFAULT_MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly smsService: SmsService,
    private readonly settings: SettingsService,
  ) {}

  private async getOtpTtlSeconds(): Promise<number> {
    const value = await this.settings.get('security.otpExpiry', String(DEFAULT_OTP_TTL_SECONDS));
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_OTP_TTL_SECONDS;
  }

  private async getMaxAttempts(): Promise<number> {
    const value = await this.settings.get('security.maxLoginAttempts', String(DEFAULT_MAX_ATTEMPTS));
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_ATTEMPTS;
  }

  private async getLockoutSeconds(): Promise<number> {
    const minutes = await this.settings.get('security.lockoutMinutes', '15');
    const parsed = parseInt(minutes, 10);
    return (Number.isFinite(parsed) && parsed > 0 ? parsed : 15) * 60;
  }

  async requestOtp(mobile: string, ipAddress: string): Promise<{ expiresInSeconds: number }> {
    const otpTtl = await this.getOtpTtlSeconds();
    const rateLimitCount = DEFAULT_RATE_LIMIT_COUNT;
    const lockoutSeconds = await this.getLockoutSeconds();

    const mobileRateLimitKey = `otp:rate:mobile:${mobile}`;
    const mobileCount = await this.redis.incr(mobileRateLimitKey);
    if (mobileCount === 1) {
      await this.redis.expire(mobileRateLimitKey, lockoutSeconds);
    }
    if (mobileCount > rateLimitCount) {
      const ttl = await this.redis.ttl(mobileRateLimitKey);
      throw new TooManyRequestsException(
        `تعداد درخواست‌های OTP بیش از حد مجاز. ${ttl} ثانیه صبر کنید`,
      );
    }

    if (ipAddress) {
      const ipRateLimitKey = `otp:rate:ip:${ipAddress}`;
      const ipCount = await this.redis.incr(ipRateLimitKey);
      if (ipCount === 1) {
        await this.redis.expire(ipRateLimitKey, lockoutSeconds);
      }
      if (ipCount > rateLimitCount * 2) {
        throw new TooManyRequestsException('درخواست بیش از حد. لطفاً بعداً تلاش کنید');
      }
    }

    const code = generateOtpCode(5);
    const codeHash = await hashString(code);
    const expiresAt = new Date(Date.now() + otpTtl * 1000);

    await this.prisma.otpRequest.updateMany({
      where: { mobile, verifiedAt: null },
      data: { verifiedAt: new Date() },
    });

    await this.prisma.otpRequest.create({
      data: {
        mobile,
        codeHash,
        expiresAt,
        ip: ipAddress,
      },
    });

    await this.smsService.sendOtp(mobile, code);

    this.logger.log(`OTP requested for ${mobile}`);
    return { expiresInSeconds: otpTtl };
  }

  async verifyOtp(mobile: string, code: string): Promise<boolean> {
    const maxAttempts = await this.getMaxAttempts();
    const lockoutSeconds = await this.getLockoutSeconds();

    const attemptKey = `otp:attempts:${mobile}`;
    const attempts = await this.redis.incr(attemptKey);
    if (attempts === 1) {
      await this.redis.expire(attemptKey, lockoutSeconds);
    }

    if (attempts > maxAttempts) {
      throw new TooManyRequestsException(
        'تعداد تلاش‌های ناموفق بیش از حد. لطفاً کد جدید درخواست دهید',
      );
    }

    const otpRequest = await this.prisma.otpRequest.findFirst({
      where: {
        mobile,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRequest) {
      throw new BadRequestException('کد تأیید منقضی شده یا یافت نشد. کد جدید درخواست دهید');
    }

    await this.prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { attempts: { increment: 1 } },
    });

    const isValid = await compareHash(code, otpRequest.codeHash);

    if (!isValid) {
      throw new BadRequestException(`کد تأیید اشتباه است. ${maxAttempts - attempts} تلاش باقی مانده`);
    }

    await this.prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { verifiedAt: new Date() },
    });

    await this.redis.del(attemptKey);

    return true;
  }
}
