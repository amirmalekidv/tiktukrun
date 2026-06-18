import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

// Custom helper since NestJS doesn't export TooManyRequestsException directly
class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { generateOtpCode, hashString, compareHash } from '../../common/utils/crypto';

const OTP_TTL_SECONDS = 120; // 2 minutes
const OTP_RATE_LIMIT_COUNT = 3;
const OTP_RATE_LIMIT_WINDOW = 180; // 3 minutes
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Request OTP for a mobile number
   */
  async requestOtp(mobile: string, ipAddress: string): Promise<{ expiresInSeconds: number }> {
    // Check rate limit by mobile
    const mobileRateLimitKey = `otp:rate:mobile:${mobile}`;
    const mobileCount = await this.redis.incr(mobileRateLimitKey);
    if (mobileCount === 1) {
      await this.redis.expire(mobileRateLimitKey, OTP_RATE_LIMIT_WINDOW);
    }
    if (mobileCount > OTP_RATE_LIMIT_COUNT) {
      const ttl = await this.redis.ttl(mobileRateLimitKey);
      throw new TooManyRequestsException(
        `تعداد درخواست‌های OTP بیش از حد مجاز. ${ttl} ثانیه صبر کنید`,
      );
    }

    // Check rate limit by IP
    if (ipAddress) {
      const ipRateLimitKey = `otp:rate:ip:${ipAddress}`;
      const ipCount = await this.redis.incr(ipRateLimitKey);
      if (ipCount === 1) {
        await this.redis.expire(ipRateLimitKey, OTP_RATE_LIMIT_WINDOW);
      }
      if (ipCount > OTP_RATE_LIMIT_COUNT * 2) {
        throw new TooManyRequestsException('درخواست بیش از حد. لطفاً بعداً تلاش کنید');
      }
    }

    // Generate OTP code
    const code = generateOtpCode(5);
    const codeHash = await hashString(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    // Invalidate previous OTP requests for this mobile (mark as verified)
    await this.prisma.otpRequest.updateMany({
      where: { mobile, verifiedAt: null },
      data: { verifiedAt: new Date() },
    });

    // Save OTP to database
    await this.prisma.otpRequest.create({
      data: {
        mobile,
        codeHash,
        expiresAt,
        ip: ipAddress,
      },
    });

    // Send SMS
    await this.smsService.sendOtp(mobile, code);

    this.logger.log(`OTP requested for ${mobile}`);
    return { expiresInSeconds: OTP_TTL_SECONDS };
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(mobile: string, code: string): Promise<boolean> {
    // Check attempt rate limit
    const attemptKey = `otp:attempts:${mobile}`;
    const attempts = await this.redis.incr(attemptKey);
    if (attempts === 1) {
      await this.redis.expire(attemptKey, OTP_RATE_LIMIT_WINDOW);
    }

    if (attempts > OTP_MAX_ATTEMPTS) {
      throw new TooManyRequestsException(
        'تعداد تلاش‌های ناموفق بیش از حد. لطفاً کد جدید درخواست دهید',
      );
    }

    // Find latest valid OTP
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

    // Update attempts
    await this.prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { attempts: { increment: 1 } },
    });

    // Verify hash
    const isValid = await compareHash(code, otpRequest.codeHash);

    if (!isValid) {
      throw new BadRequestException(`کد تأیید اشتباه است. ${OTP_MAX_ATTEMPTS - attempts} تلاش باقی مانده`);
    }

    // Mark OTP as used
    await this.prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { verifiedAt: new Date() },
    });

    // Clear rate limit counters on success
    await this.redis.del(attemptKey);

    return true;
  }
}
