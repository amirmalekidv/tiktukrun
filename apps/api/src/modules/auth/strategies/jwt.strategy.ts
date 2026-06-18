import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  mobile: string;
  roles: string[];
  sessionId: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'fallback-secret-please-change'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    const userId = payload.sub;
    const sessionId = payload.sessionId;

    // Verify session is still valid
    // [QA Fix 2026-05-25] Session schema uses revokedAt (not isRevoked)
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException('نشست منقضی یا باطل شده است. لطفاً دوباره وارد شوید');
    }

    // Fetch user with roles
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: true,
      },
    });

    // [QA Fix 2026-05-25] User uses deletedAt (not isDeleted)
    if (!user || (user as any).deletedAt) {
      throw new UnauthorizedException('کاربر یافت نشد');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('حساب کاربری شما مسدود شده است');
    }

    return {
      id: user.id,
      mobile: user.mobile,
      roles: user.roleAssignments.map((r) => r.role),
      sessionId,
    };
  }
}
