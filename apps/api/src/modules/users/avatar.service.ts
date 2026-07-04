import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAvatarConfigDto } from './dto/update-avatar-config.dto';
import { PurchaseAvatarItemDto } from './dto/purchase-avatar-item.dto';
import { serializeBigInts } from '../../common/utils/bigint';
import { getStorageDir, toPublicUploadUrl } from '../../common/utils/storage-path';
import { TransactionCurrency, TransactionRefType } from '@tiktakrun/shared-types';
import { AvatarItemType, TransactionType } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);
  private readonly defaultCatalog = [
    {
      code: 'hat_pumpkin',
      name: 'کلاه کدویی',
      type: AvatarItemType.HAT,
      icon: '🎃',
      requiredLevel: 1,
      priceDiamonds: 0,
      isDefault: true,
    },
    {
      code: 'hat_witch',
      name: 'کلاه جادوگر',
      type: AvatarItemType.HAT,
      icon: '🎩',
      requiredLevel: 3,
      priceDiamonds: 12,
      isDefault: false,
    },
    {
      code: 'hat_crown',
      name: 'تاج نفرین‌شده',
      type: AvatarItemType.HAT,
      icon: '👑',
      requiredLevel: 6,
      priceDiamonds: 24,
      isDefault: false,
    },
    {
      code: 'hat_horns',
      name: 'شاخ‌های جهنمی',
      type: AvatarItemType.HAT,
      icon: '😈',
      requiredLevel: 9,
      priceDiamonds: 38,
      isDefault: false,
    },
    {
      code: 'glasses_shadow',
      name: 'عینک سایه',
      type: AvatarItemType.GLASSES,
      icon: '🕶️',
      requiredLevel: 1,
      priceDiamonds: 0,
      isDefault: true,
    },
    {
      code: 'glasses_spectral',
      name: 'عینک طیفی',
      type: AvatarItemType.GLASSES,
      icon: '👓',
      requiredLevel: 4,
      priceDiamonds: 15,
      isDefault: false,
    },
    {
      code: 'skin_ember',
      name: 'پوست خاکستر',
      type: AvatarItemType.SKIN,
      icon: '💀',
      requiredLevel: 1,
      priceDiamonds: 0,
      isDefault: true,
    },
    {
      code: 'skin_bonefire',
      name: 'پوست استخوانی',
      type: AvatarItemType.SKIN,
      icon: '☠️',
      requiredLevel: 5,
      priceDiamonds: 20,
      isDefault: false,
    },
    {
      code: 'effect_pulse',
      name: 'هاله خون',
      type: AvatarItemType.EFFECT,
      icon: '✨',
      requiredLevel: 1,
      priceDiamonds: 0,
      isDefault: true,
    },
    {
      code: 'effect_runes',
      name: 'رون‌های نفرین',
      type: AvatarItemType.EFFECT,
      icon: '🔮',
      requiredLevel: 8,
      priceDiamonds: 28,
      isDefault: false,
    },
    {
      code: 'background_default',
      name: 'مه سرخ',
      type: AvatarItemType.BACKGROUND,
      icon: '🌑',
      requiredLevel: 1,
      priceDiamonds: 0,
      isDefault: true,
    },
    {
      code: 'background_fire',
      name: 'دوزخ آتش',
      type: AvatarItemType.BACKGROUND,
      icon: '🔥',
      requiredLevel: 5,
      priceDiamonds: 18,
      isDefault: false,
    },
    {
      code: 'background_cemetery',
      name: 'گورستان',
      type: AvatarItemType.BACKGROUND,
      icon: '🪦',
      requiredLevel: 7,
      priceDiamonds: 26,
      isDefault: false,
    },
    {
      code: 'background_void',
      name: 'خلأ سایه',
      type: AvatarItemType.BACKGROUND,
      icon: '🌌',
      requiredLevel: 10,
      priceDiamonds: 34,
      isDefault: false,
    },
  ] as const;

  constructor(private readonly prisma: PrismaService) {}

  private async ensureDefaultAvatarCatalog() {
    const count = await this.prisma.avatarItem.count();
    if (count > 0) return;

    this.logger.warn('Avatar catalog was empty. Seeding default avatar items.');

    for (const item of this.defaultCatalog) {
      await this.prisma.avatarItem.create({
        data: item,
      });
    }
  }

  private async getDefaultAvatarConfig() {
    await this.ensureDefaultAvatarCatalog();

    const defaults = await this.prisma.avatarItem.findMany({
      where: { isActive: true, isDefault: true },
      select: { id: true, type: true },
    });

    const config: Record<string, string> = {};
    for (const item of defaults) {
      if (item.type === AvatarItemType.HAT) config.hatId = item.id;
      if (item.type === AvatarItemType.GLASSES) config.glassesId = item.id;
      if (item.type === AvatarItemType.SKIN) config.skinId = item.id;
      if (item.type === AvatarItemType.EFFECT) config.effectId = item.id;
      if (item.type === AvatarItemType.BACKGROUND) config.backgroundId = item.id;
    }

    return config;
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    if (!file) {
      throw new BadRequestException('فایل تصویر الزامی است');
    }

    const avatarDir = getStorageDir('avatars');

    const fileName = `${userId}.webp`;
    const filePath = path.join(avatarDir, fileName);

    // Save file (Sharp processing would be applied in production)
    fs.writeFileSync(filePath, file.buffer);

    const avatarUrl = toPublicUploadUrl(`avatars/${fileName}`);

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  /**
   * Update avatar equipment configuration
   */
  async updateAvatarConfig(userId: string, dto: UpdateAvatarConfigDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarConfig: true },
    });

    const updates: any = {};

    const itemFields: Array<{ field: string; type: AvatarItemType }> = [
      { field: 'hatId', type: AvatarItemType.HAT },
      { field: 'glassesId', type: AvatarItemType.GLASSES },
      { field: 'skinId', type: AvatarItemType.SKIN },
      { field: 'effectId', type: AvatarItemType.EFFECT },
      { field: 'backgroundId', type: AvatarItemType.BACKGROUND },
    ];

    // Verify each item is owned
    for (const { field, type } of itemFields) {
      const itemId = dto[field];
      if (itemId === undefined) continue;

      if (itemId === null) {
        updates[field] = null;
        continue;
      }

      // Check ownership
      const owned = await this.prisma.userAvatarItem.findFirst({
        where: { userId, itemId },
        include: { item: true },
      });

      if (!owned) {
        throw new ForbiddenException(`آیتم ${type} را خریداری نکرده‌اید`);
      }

      if (owned.item.type !== type) {
        throw new BadRequestException(`آیتم ${itemId} از نوع ${type} نیست`);
      }

      updates[field] = itemId;
    }

    // Equipment configuration is stored on the User.avatarConfig JSON field
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarConfig: {
          ...((user?.avatarConfig as Record<string, unknown> | null) ?? {}),
          ...updates,
        },
      },
    });

    return updated;
  }

  async getAvatarConfig(userId: string) {
    const [user, defaults] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { avatarConfig: true },
      }),
      this.getDefaultAvatarConfig(),
    ]);

    return {
      config: {
        ...defaults,
        ...((user?.avatarConfig as Record<string, unknown> | null) ?? {}),
      },
    };
  }

  /**
   * Purchase an avatar item with diamonds
   */
  async purchaseAvatarItem(userId: string, dto: PurchaseAvatarItemDto) {
    const item = await this.prisma.avatarItem.findUnique({
      where: { id: dto.itemId },
    });

    if (!item || !item.isActive) {
      throw new NotFoundException('آیتم یافت نشد');
    }

    // Check if already purchased
    const existing = await this.prisma.userAvatarItem.findFirst({
      where: { userId, itemId: dto.itemId },
    });

    if (existing) {
      throw new ConflictException('این آیتم را قبلاً خریداری کرده‌اید');
    }

    // Get wallet
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: userId } });
    if (!wallet) throw new NotFoundException('کیف پول یافت نشد');

    const priceDiamonds = Number(item.priceDiamonds);
    if (wallet.diamondsBalance < priceDiamonds) {
      throw new BadRequestException(
        `الماس کافی ندارید. موجودی: ${wallet.diamondsBalance}، نیاز: ${priceDiamonds}`,
      );
    }

    // Execute purchase in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const newBalance = wallet.diamondsBalance - priceDiamonds;

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.WITHDRAW,
          currency: TransactionCurrency.DIAMONDS,
          amount: priceDiamonds,
          balanceAfter: newBalance,
          refType: TransactionRefType.AVATAR_PURCHASE,
          refId: item.id,
          description: `خرید آیتم: ${item.name}`,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { diamondsBalance: newBalance },
      });

      const userItem = await tx.userAvatarItem.create({
        data: { userId: userId, itemId: item.id },
        include: { item: true },
      });

      return userItem;
    });

    return {
      item: result,
      message: `آیتم «${item.name}» با موفقیت خریداری شد`,
    };
  }

  /**
   * Get all avatar items with purchase status
   */
  async getAvatarItems(userId: string) {
    await this.ensureDefaultAvatarCatalog();

    const [allItems, userItems, user] = await Promise.all([
      this.prisma.avatarItem.findMany({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { requiredLevel: 'asc' }],
      }),
      this.prisma.userAvatarItem.findMany({
        where: { userId: userId },
        select: { itemId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { avatarConfig: true },
      }),
    ]);

    const ownedMap = new Map(userItems.map((ui) => [ui.itemId, ui]));
    const avatarConfig = (user?.avatarConfig as Record<string, string | null> | null) ?? {};
    const equippedIds = new Set(
      ['hatId', 'glassesId', 'skinId', 'effectId', 'backgroundId']
        .map((key) => avatarConfig[key])
        .filter((value): value is string => Boolean(value)),
    );

    return allItems.map((item) => ({
      ...item,
      status: item.isDefault ? 'default' : ownedMap.has(item.id) ? 'owned' : 'locked',
      isEquipped: equippedIds.has(item.id) || (!equippedIds.size && item.isDefault),
    }));
  }
}
