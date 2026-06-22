import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, Role } from '@tiktakrun/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { OtpService } from './otp.service';
import { hashString, compareHash, generateInviteCode } from '../../common/utils/crypto';
import { serializeBigInts } from '../../common/utils/bigint';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Step 1: Request OTP
   */
  async requestOtp(mobile: string, ipAddress: string) {
    return this.otpService.requestOtp(mobile, ipAddress);
  }

  /**
   * Step 2: Verify OTP and authenticate/register user
   */
  async verifyOtp(mobile: string, code: string, inviteCode?: string, ipAddress?: string, deviceInfo?: string) {
    // Verify OTP
    await this.otpService.verifyOtp(mobile, code);

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { mobile },
      include: {
        profile: true,
        wallet: true,
        roleAssignments: true,
      },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await this.createNewUser(mobile, inviteCode);
    }

    const roles = user.roleAssignments.map((roleAssignment) => roleAssignment.role as unknown as Role);

    // Create session and tokens
    const tokens = await this.createTokens(user.id, mobile, roles, deviceInfo, ipAddress);

    this.logger.log(`User ${mobile} authenticated (new: ${isNewUser})`);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      profile: user.profile,
      wallet: user.wallet ? serializeBigInts(user.wallet) : null,
      isNewUser,
    };
  }

  /**
   * Create a new user with wallet, profile, role
   * [QA Fix 2026-05-25] Rewritten to match actual schema:
   *   - tx.profile → tx.userProfile (model is UserProfile)
   *   - profile data: levelId (not level), xp on UserProfile (not Wallet)
   *   - Wallet has tomanBalance/coinsBalance/diamondsBalance (no xpBalance)
   *   - User has no isDeleted field; uses deletedAt
   */
  private async createNewUser(mobile: string, inviteCode?: string) {
    const userInviteCode = generateInviteCode(8);

    const user = await this.prisma.$transaction(async (tx: any) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          mobile,
          inviteCode: userInviteCode,
        },
      });

      // Assign CUSTOMER role
      await tx.userRoleAssignment.create({
        data: { userId: newUser.id, role: Role.CUSTOMER },
      });

      // Create wallet
      await tx.wallet.create({
        data: { userId: newUser.id },
      });

      // Create profile (UserProfile in schema)
      await tx.userProfile.create({
        data: { userId: newUser.id, levelId: 1, xp: 0 },
      });

      // Handle invite code
      if (inviteCode) {
        const inviter = await tx.user.findFirst({
          where: { inviteCode, deletedAt: null },
        });

        if (inviter) {
          // Register invite usage
          try {
            await tx.inviteUsage.create({
              data: {
                code: inviteCode,
                inviterId: inviter.id,
                inviteeId: newUser.id,
                rewardXp: 5,
              },
            });

            // Add XP to inviter's UserProfile
            await tx.userProfile.update({
              where: { userId: inviter.id },
              data: { xp: { increment: 5 } },
            });
          } catch (e) {
            // Non-fatal: invite reward tracking failed, log but continue
            this.logger.warn(`Invite reward failed for ${inviter.id}: ${(e as Error).message}`);
          }
        }
      }

      return tx.user.findUnique({
        where: { id: newUser.id },
        include: { profile: true, wallet: true, roleAssignments: true },
      });
    });

    return user;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, ipAddress?: string) {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token نامعتبر یا منقضی شده است');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    // Find and validate session
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: { include: { roleAssignments: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('نشست منقضی شده است. لطفاً دوباره وارد شوید');
    }

    // Verify refresh token hash
    const isValid = await compareHash(refreshToken, session.refreshTokenHash);
    if (!isValid) {
      // Possible token theft - revoke session
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('توکن نامعتبر. نشست باطل شد');
    }

    // Rotate: revoke old session
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Create new tokens
    const user = session.user;
    const roles = user.roleAssignments.map((roleAssignment) => roleAssignment.role as unknown as Role);
    const tokens = await this.createTokens(
      user.id,
      user.mobile,
      roles,
      session.ua ?? undefined,
      ipAddress,
    );

    return tokens;
  }

  /**
   * Logout - revoke session
   */
  async logout(sessionId: string) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { message: 'با موفقیت خارج شدید' };
  }

  /**
   * Get current user info
   */
  async getMe(userId: string) {
    // [QA Fix 2026-05-25] Schema fields: userBadges (not badges), userAvatarItems
    // UserBadge: awardedAt (not createdAt), composite key
    // UserAvatarItem: isActive (not isEquipped)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: true,
        roleAssignments: true,
        userBadges: {
          include: { badge: true },
          take: 10,
          orderBy: { awardedAt: 'desc' },
        },
        userAvatarItems: {
          where: { isActive: true },
          include: { item: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException('کاربر یافت نشد');

    return {
      ...this.sanitizeUser(user),
      profile: user.profile,
      wallet: user.wallet ? serializeBigInts(user.wallet) : null,
      badges: user.userBadges,
      equippedAvatarItems: user.userAvatarItems,
      permissions: this.getPermissions(user.roleAssignments.map(r => r.role)),
    };
  }

  /**
   * Validate admin login with password
   */
  async validateAdmin(mobile: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { mobile },
      include: { roleAssignments: true },
    });

    if (!user || !user.passwordHash) return null;

    const isValid = await compareHash(password, user.passwordHash);
    if (!isValid) return null;

    // [QA Fix 2026-05-25] Schema enum: SUPER_ADMIN (not SUPERADMIN), no OPERATOR (use BRANCH_MANAGER + MARKETING)
    const adminRoles: any[] = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SUPPORT', 'MARKETING'];
    const isAdmin = user.roleAssignments.some((r: any) => adminRoles.includes(r.role));

    if (!isAdmin) return null;

    return user;
  }

  /**
   * Admin login with password
   */
  async adminLogin(user: any, ipAddress?: string, deviceInfo?: string) {
    const roles = user.roleAssignments?.map((r: any) => r.role) || [];
    const tokens = await this.createTokens(user.id, user.mobile, roles, deviceInfo, ipAddress);

    // [QA Fix 2026-05-25] AuditLog schema fields: actorId, action (string), entity, entityId, ip, ua
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'auth.admin_login',
          entity: 'user',
          entityId: String(user.id),
          ip: ipAddress ?? null,
          ua: deviceInfo ?? null,
          afterJson: { method: 'password', roles } as any,
        } as any,
      });
    } catch (e: any) {
      this.logger.warn(`auditLog skipped: ${e?.message}`);
    }

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Create access + refresh tokens and session
   */
  private async createTokens(
    userId: string,
    mobile: string,
    roles: Role[],
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create session placeholder first to get ID
    // [QA Fix 2026-05-25] schema fields: ip, ua (not deviceInfo/ipAddress)
    const session = await this.prisma.session.create({
      data: {
        userId: userId,
        refreshTokenHash: 'pending',
        ua: deviceInfo,
        ip: ipAddress,
        expiresAt,
      },
    });

    const accessPayload: JwtPayload = {
      sub: userId,
      mobile,
      roles: roles as any,
      sessionId: session.id,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      mobile,
      roles: roles as any,
      sessionId: session.id,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    // Store hash of refresh token
    const refreshTokenHash = await hashString(refreshToken);
    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  private getPermissions(roles: any[]): string[] {
    const permissions: string[] = [];
    // [QA Fix 2026-05-25] Use schema enum literals: SUPER_ADMIN, ADMIN, BRANCH_MANAGER, SUPPORT, MARKETING, CUSTOMER
    if (roles.includes('SUPER_ADMIN')) {
      permissions.push('*');
    } else {
      if (roles.includes('ADMIN')) permissions.push('admin:*');
      if (roles.includes('BRANCH_MANAGER')) permissions.push('bookings:*', 'users:read', 'branches:manage');
      if (roles.includes('MARKETING')) permissions.push('campaigns:*', 'segments:*');
      if (roles.includes('SUPPORT')) permissions.push('users:read', 'support:*');
      if (roles.includes('CUSTOMER')) permissions.push('profile:*', 'bookings:create');
    }
    return permissions;
  }
}
