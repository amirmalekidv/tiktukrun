import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { SettingsService } from '../settings/settings.service';
import { generateOtpCode, hashString, compareHash, OTP_CODE_LENGTH } from '../../common/utils/crypto';

const DEFAULT_OTP_TTL_SECONDS = 120;
const DEFAULT_RATE_LIMIT_COUNT = 3;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_DEMO_OTP_CODE = '123456';

/** MongoDB + Prisma: unset optional fields are not matched by `verifiedAt: null`. */
function unverifiedOtpWhere(mobile: string) {
  return {
    mobile,
    OR: [
      { verifiedAt: { equals: null } },
      { verifiedAt: { isSet: false } },
    ],
  };
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly smsService: SmsService,
    private readonly settings: SettingsService,
    private readonly config: ConfigService,
  ) {}

  private getDemoOtpCode(): string {
    const configuredCode = this.config.get<string>('AUTH_DEMO_OTP_CODE')?.trim();
    if (configuredCode) return configuredCode;

    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    return nodeEnv === 'production' ? '' : DEFAULT_DEMO_OTP_CODE;
  }

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
    const demoOtpCode = this.getDemoOtpCode();

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

    const code = generateOtpCode(OTP_CODE_LENGTH);
    const codeHash = await hashString(code);
    const expiresAt = new Date(Date.now() + otpTtl * 1000);

    await this.prisma.otpRequest.updateMany({
      where: unverifiedOtpWhere(mobile),
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

    try {
      await this.smsService.sendOtp(mobile, code);
    } catch (error) {
      if (demoOtpCode) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `OTP SMS failed for ${mobile}; continuing with demo OTP mode: ${message}`,
        );
      } else {
        throw error;
      }
    }

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

    const demoOtpCode = this.getDemoOtpCode();
    if (demoOtpCode && code === demoOtpCode) {
      const activeOtpRequest = await this.prisma.otpRequest.findFirst({
        where: {
          ...unverifiedOtpWhere(mobile),
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (activeOtpRequest) {
        await this.prisma.otpRequest.update({
          where: { id: activeOtpRequest.id },
          data: { verifiedAt: new Date() },
        });
      }

      await this.redis.del(attemptKey);
      this.logger.warn(`Demo OTP used for ${mobile}`);
      return true;
    }

    const otpRequest = await this.prisma.otpRequest.findFirst({
      where: {
        ...unverifiedOtpWhere(mobile),
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
