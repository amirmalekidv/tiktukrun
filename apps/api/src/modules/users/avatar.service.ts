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
import { AvatarItemType, TransactionType } from '@prisma/client';
import { TransactionCurrency, TransactionRefType } from '../../common/prisma-shims';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upload avatar image
   */
  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    if (!file) {
      throw new BadRequestException('فایل تصویر الزامی است');
    }

    const storagePath = process.env.STORAGE_PATH || './storage/uploads/avatars';
    const avatarDir = path.resolve(storagePath);

    // Ensure directory exists
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }

    const fileName = `${userId}.webp`;
    const filePath = path.join(avatarDir, fileName);

    // Save file (Sharp processing would be applied in production)
    fs.writeFileSync(filePath, file.buffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;

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
      data: { avatarConfig: updates },
    });

    return updated;
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
    const [allItems, userItems] = await Promise.all([
      this.prisma.avatarItem.findMany({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { requiredLevel: 'asc' }],
      }),
      this.prisma.userAvatarItem.findMany({
        where: { userId: userId },
        select: { itemId: true, isActive: true },
      }),
    ]);

    const ownedMap = new Map(userItems.map((ui) => [ui.itemId, ui]));

    return allItems.map((item) => ({
      ...item,
      status: item.isDefault ? 'default' : ownedMap.has(item.id) ? 'owned' : 'locked',
      isEquipped: ownedMap.get(item.id)?.isActive || item.isDefault,
    }));
  }
}
