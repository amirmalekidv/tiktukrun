import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import { PaymentsService } from '../payments/payments.service';
import {
  ChargeWalletDto,
  PurchaseDiamondsDto,
  PurchaseCoinsDto,
  ConvertCurrencyDto,
  ManualAdjustDto,
  WalletTransactionQueryDto,
} from './dto/wallet.dto';
import { serializeBigInts } from '../../common/utils/bigint';
import { parsePagination, paginate } from '../../common/utils/pagination.helper';
import { TransactionType, PaymentStatus, PaymentMethod, CurrencyType } from '@prisma/client';

// ─── Diamond Packages ────────────────────────────────────────────────────────
const DIAMOND_PACKAGES = [
  { id: 'pkg_50', diamonds: 50, priceToman: 50000, label: '۵۰ الماس' },
  { id: 'pkg_200', diamonds: 200, priceToman: 180000, label: '۲۰۰ الماس' },
  { id: 'pkg_500', diamonds: 500, priceToman: 400000, label: '۵۰۰ الماس' },
  { id: 'pkg_1500', diamonds: 1500, priceToman: 1000000, label: '۱,۵۰۰ الماس' },
];

// ─── Coin Packages ────────────────────────────────────────────────────────────
const COIN_PACKAGES = [
  { id: 'coin_100', coins: 100, priceToman: 10000, label: '۱۰۰ سکه' },
  { id: 'coin_500', coins: 500, priceToman: 45000, label: '۵۰۰ سکه' },
  { id: 'coin_1000', coins: 1000, priceToman: 80000, label: '۱,۰۰۰ سکه' },
  { id: 'coin_5000', coins: 5000, priceToman: 350000, label: '۵,۰۰۰ سکه' },
];

// ─── Conversion Rate ──────────────────────────────────────────────────────────
const XP_TO_COINS_RATE = 2; // 1 XP = 2 coins
const MIN_CONVERT_XP = 50;

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly settings: SettingsService,
    private readonly payments: PaymentsService,
  ) {}

  /** موجودی تومانی کاربر (برای بررسی قبل از پرداخت رزرو) */
  async getBalance(userId: string): Promise<bigint> {
    const wallet = await this.prisma.wallet.findUnique({
      where:  { userId },
      select: { tomanBalance: true },
    });
    return BigInt(wallet?.tomanBalance ?? 0);
  }

  // اطمینان از وجود کیف پول
  private async ensureWallet(userId: string) {
    return this.prisma.wallet.upsert({
      where:  { userId },
      update: {},
      create: { userId },
    });
  }

  /** دریافت کیف پول کاربر */
  async getMyWallet(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return serializeBigInts(wallet);
  }

  /** تاریخچه تراکنش‌ها */
  async getTransactions(userId: string, query: WalletTransactionQueryDto) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('کیف پول یافت نشد');

    const { page, limit, skip } = parsePagination(query);
    const where: any = { walletId: wallet.id };
    if (query.currency) where.currency = query.currency;
    if (query.type) where.type = query.type;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.transaction.count({ where }),
    ]);

    return paginate(transactions.map((t) => serializeBigInts(t)), total, page, limit);
  }

  /** شروع شارژ کیف پول (درگاه پرداخت) */
  async chargeWallet(userId: string, dto: ChargeWalletDto) {
    const sandboxSetting = await this.settings.get('payments.sandboxMode', 'true');
    const isSandbox = sandboxSetting === 'true'
      || this.configService.get<string>('ZARINPAL_SANDBOX', 'true') === 'true';

    const wallet = await this.ensureWallet(userId);

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        walletId: wallet.id,
        amount:   dto.amount,
        method:   PaymentMethod.ZARINPAL,
        status:   PaymentStatus.PENDING,
        gateway:  'zarinpal',
        gatewayResponse: {
          purpose: 'wallet_charge',
          method:  dto.method,
          description: `شارژ کیف پول - ${dto.amount.toLocaleString()} تومان`,
        },
      },
    });

    const apiUrl = this.configService.get('API_URL', 'http://localhost:4000');
    const verifyBase = `${apiUrl}/api/v1/payments/zarinpal/verify?paymentId=${payment.id}`;

    if (isSandbox) {
      const fakeAuthority = `TEST_${payment.id}`;
      await this.prisma.payment.update({
        where: { id: payment.id },
        data:  { gatewayAuthority: fakeAuthority },
      });

      return serializeBigInts({
        paymentId:  payment.id,
        paymentUrl: `${verifyBase}&Authority=${fakeAuthority}&Status=OK`,
        isSandbox:  true,
        message:    'در حالت تست - پرداخت شبیه‌سازی شده است',
      });
    }

    const initiateResult = await this.payments.initiate({
      amount:      dto.amount,
      description: `شارژ کیف پول - ${dto.amount.toLocaleString()} تومان`,
      callbackUrl: '',
      userId,
      paymentId:   payment.id,
    });

    return serializeBigInts({
      paymentId:  payment.id,
      paymentUrl: initiateResult.paymentUrl,
      isSandbox:  false,
    });
  }

  /** خرید الماس با موجودی تومانی */
  async purchaseDiamonds(userId: string, dto: PurchaseDiamondsDto) {
    const pkg = DIAMOND_PACKAGES.find((p) => p.id === dto.packageId);
    if (!pkg) throw new BadRequestException('بسته الماس یافت نشد');

    const wallet = await this.ensureWallet(userId);
    if (wallet.tomanBalance < pkg.priceToman) {
      throw new BadRequestException(
        `موجودی تومان کافی نیست. موجودی: ${wallet.tomanBalance}، نیاز: ${pkg.priceToman}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const newTomanBalance   = wallet.tomanBalance - pkg.priceToman;
      const newDiamondBalance = wallet.diamondsBalance + pkg.diamonds;

      await tx.transaction.create({
        data: {
          walletId: wallet.id, type: TransactionType.DIAMOND_PURCHASE, currency: CurrencyType.TOMAN,
          amount: -pkg.priceToman, balanceAfter: newTomanBalance,
          refType: 'DIAMOND_PURCHASE', refId: pkg.id, description: `خرید ${pkg.label}`,
        },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id, type: TransactionType.DIAMOND_PURCHASE, currency: CurrencyType.DIAMONDS,
          amount: pkg.diamonds, balanceAfter: newDiamondBalance,
          refType: 'DIAMOND_PURCHASE', refId: pkg.id, description: `دریافت ${pkg.label}`,
        },
      });

      return tx.wallet.update({
        where: { id: wallet.id },
        data:  { tomanBalance: newTomanBalance, diamondsBalance: newDiamondBalance },
      });
    });

    return serializeBigInts({ message: `${pkg.label} با موفقیت خریداری شد`, wallet: result, package: pkg });
  }

  /** خرید سکه با موجودی تومانی */
  async purchaseCoins(userId: string, dto: PurchaseCoinsDto) {
    const pkg = COIN_PACKAGES.find((p) => p.id === dto.packageId);
    if (!pkg) throw new BadRequestException('بسته سکه یافت نشد');

    const wallet = await this.ensureWallet(userId);
    if (wallet.tomanBalance < pkg.priceToman) {
      throw new BadRequestException(
        `موجودی تومان کافی نیست. موجودی: ${wallet.tomanBalance}، نیاز: ${pkg.priceToman}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const newTomanBalance = wallet.tomanBalance - pkg.priceToman;
      const newCoinsBalance = wallet.coinsBalance + pkg.coins;

      await tx.transaction.create({
        data: {
          walletId: wallet.id, type: TransactionType.COIN_PURCHASE, currency: CurrencyType.TOMAN,
          amount: -pkg.priceToman, balanceAfter: newTomanBalance,
          refType: 'COIN_PURCHASE', refId: pkg.id, description: `خرید ${pkg.label}`,
        },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id, type: TransactionType.COIN_PURCHASE, currency: CurrencyType.COINS,
          amount: pkg.coins, balanceAfter: newCoinsBalance,
          refType: 'COIN_PURCHASE', refId: pkg.id, description: `دریافت ${pkg.label}`,
        },
      });

      return tx.wallet.update({
        where: { id: wallet.id },
        data:  { tomanBalance: newTomanBalance, coinsBalance: newCoinsBalance },
      });
    });

    return serializeBigInts({ message: `${pkg.label} با موفقیت خریداری شد`, wallet: result, package: pkg });
  }

  /** تبدیل XP به سکه (XP در پروفایل نگه‌داری می‌شود) */
  async convertCurrency(userId: string, dto: ConvertCurrencyDto) {
    if (dto.from !== 'XP' || dto.to !== 'COINS') {
      throw new BadRequestException('فقط تبدیل XP به سکه پشتیبانی می‌شود');
    }
    if (dto.amount < MIN_CONVERT_XP) {
      throw new BadRequestException(`حداقل مقدار تبدیل ${MIN_CONVERT_XP} XP است`);
    }

    const wallet  = await this.ensureWallet(userId);
    const profile = await this.prisma.userProfile.findUnique({ where: { userId }, select: { xp: true } });
    if (!profile) throw new NotFoundException('پروفایل یافت نشد');
    if (profile.xp < dto.amount) throw new BadRequestException('XP کافی ندارید');

    const coinsToAdd = dto.amount * XP_TO_COINS_RATE;

    const result = await this.prisma.$transaction(async (tx) => {
      const newCoinsBalance = wallet.coinsBalance + coinsToAdd;

      await tx.userProfile.update({ where: { userId }, data: { xp: { decrement: dto.amount } } });
      await tx.transaction.create({
        data: {
          walletId: wallet.id, type: TransactionType.MANUAL_ADJUST, currency: CurrencyType.XP,
          amount: -dto.amount, balanceAfter: profile.xp - dto.amount,
          refType: 'CURRENCY_CONVERT', description: `تبدیل ${dto.amount} XP به سکه`,
        },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id, type: TransactionType.MANUAL_ADJUST, currency: CurrencyType.COINS,
          amount: coinsToAdd, balanceAfter: newCoinsBalance,
          refType: 'CURRENCY_CONVERT', description: `دریافت ${coinsToAdd} سکه از تبدیل XP`,
        },
      });

      return tx.wallet.update({ where: { id: wallet.id }, data: { coinsBalance: newCoinsBalance } });
    });

    return serializeBigInts({
      message:   `${dto.amount} XP به ${coinsToAdd} سکه تبدیل شد`,
      wallet:    result,
      converted: { xp: dto.amount, coins: coinsToAdd },
    });
  }

  getDiamondPackages() { return DIAMOND_PACKAGES; }
  getCoinPackages()    { return COIN_PACKAGES; }

  /** اعمال تراکنش اتمیک (استفاده داخلی) */
  async applyTransaction(
    walletId: string,
    type: TransactionType,
    currency: CurrencyType,
    amount: number,
    refType?: string,
    refId?: string,
    description?: string,
  ) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('کیف پول یافت نشد');

    const currencyField = ({
      [CurrencyType.TOMAN]:    'tomanBalance',
      [CurrencyType.COINS]:    'coinsBalance',
      [CurrencyType.DIAMONDS]: 'diamondsBalance',
      [CurrencyType.XP]:       'tomanBalance', // XP در wallet نگه‌داری نمی‌شود؛ به‌صورت پیش‌فرض tomanBalance
    } as Record<string, string>)[currency];

    const currentBalance = (wallet as any)[currencyField] as number;
    const newBalance = currentBalance + amount;
    if (newBalance < 0) throw new ForbiddenException('موجودی کافی نیست');

    return this.prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: { walletId, type, currency, amount, balanceAfter: newBalance, refType, refId, description },
      });
      await tx.wallet.update({ where: { id: walletId }, data: { [currencyField]: newBalance } });
    });
  }

  // ─── Admin Methods ─────────────────────────────────────────────────────────

  async adminListTransactions(query: any) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};

    if (query.userId) {
      const wallet = await this.prisma.wallet.findUnique({ where: { userId: query.userId } });
      if (wallet) where.walletId = wallet.id;
    }
    if (query.currency) where.currency = query.currency;
    if (query.type) where.type = query.type;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { wallet: { include: { user: { select: { id: true, mobile: true, fullName: true } } } } },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return paginate(transactions.map((t) => serializeBigInts(t)), total, page, limit);
  }

  async adminManualAdjust(dto: ManualAdjustDto, adminId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: dto.userId } });
    if (!wallet) throw new NotFoundException('کیف پول یافت نشد');

    if (dto.currency === 'XP') {
      // XP در پروفایل تنظیم می‌شود
      const profile = await this.prisma.userProfile.findUnique({ where: { userId: dto.userId }, select: { xp: true } });
      const newXp = (profile?.xp ?? 0) + dto.delta;
      if (newXp < 0) throw new BadRequestException('موجودی نمی‌تواند منفی شود');
      await this.prisma.userProfile.update({ where: { userId: dto.userId }, data: { xp: newXp } });
      await this.prisma.auditLog.create({
        data: { actorId: adminId, entity: 'wallet', entityId: dto.userId, action: 'WALLET_ADJUSTED', afterJson: serializeBigInts(dto) },
      });
      return serializeBigInts({ message: 'XP تنظیم شد', xp: newXp });
    }

    const currencyField = ({ TOMAN: 'tomanBalance', COINS: 'coinsBalance', DIAMONDS: 'diamondsBalance' } as Record<string, string>)[dto.currency];
    const currentBalance = (wallet as any)[currencyField] as number;
    const delta = dto.delta;
    const newBalance = currentBalance + delta;
    if (newBalance < 0) throw new BadRequestException('موجودی نمی‌تواند منفی شود');

    return this.prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          walletId: wallet.id, type: TransactionType.MANUAL_ADJUST, currency: dto.currency as CurrencyType,
          amount: delta, balanceAfter: newBalance,
          refType: 'MANUAL_ADJUST', description: `${dto.reason} (ادمین: ${adminId})`,
        },
      });
      const updatedWallet = await tx.wallet.update({ where: { id: wallet.id }, data: { [currencyField]: newBalance } });
      await tx.auditLog.create({
        data: { actorId: adminId, entity: 'wallet', entityId: dto.userId, action: 'WALLET_ADJUSTED', afterJson: serializeBigInts(dto) },
      });
      return serializeBigInts({ message: 'کیف پول تنظیم شد', wallet: updatedWallet });
    });
  }
}
