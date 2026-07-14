import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CurrentUserPayload, JwtPayload, UserRole } from '@tiktakrun/shared-types';
import { PrismaService } from '../../../prisma/prisma.service';

const ROLE_PRIORITY: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.BRANCH_MANAGER,
  UserRole.SUPPORT,
  UserRole.MARKETING,
  UserRole.CUSTOMER,
];

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
    // MongoDB: optional fields omitted on create don't match `revokedAt: null`
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: { isSet: false },
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
        managedBranches: { select: { id: true } },
      },
    });

    // [QA Fix 2026-05-25] User uses deletedAt (not isDeleted)
    if (!user || (user as any).deletedAt) {
      throw new UnauthorizedException('کاربر یافت نشد');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('حساب کاربری شما مسدود شده است');
    }

    const roles = user.roleAssignments.map((r) => r.role as UserRole);
    const primaryRole =
      ROLE_PRIORITY.find((role) => roles.includes(role)) ??
      roles[0] ??
      UserRole.CUSTOMER;

    const branchIds = user.managedBranches.map((b) => b.id);

    const requestUser: CurrentUserPayload = {
      id: user.id,
      mobile: user.mobile,
      roles,
      role: primaryRole,
      branchId: branchIds[0],
      branchIds,
      sessionId,
    };

    return requestUser;
  }
}
