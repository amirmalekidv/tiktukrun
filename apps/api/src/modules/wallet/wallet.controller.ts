import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import {
  ChargeWalletDto,
  PurchaseDiamondsDto,
  PurchaseCoinsDto,
  ConvertCurrencyDto,
  ManualAdjustDto,
  WalletTransactionQueryDto,
} from './dto/wallet.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/prisma-shims';

// ─── User Wallet Controller ───────────────────────────────────────────────────

@ApiTags('Wallet — کیف پول')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @ApiOperation({ summary: 'موجودی کیف پول' })
  async getMyWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getMyWallet(userId);
  }

  @Get('me/transactions')
  @ApiOperation({ summary: 'تاریخچه تراکنش‌ها' })
  @ApiQuery({ name: 'currency', required: false, enum: ['TOMAN', 'COINS', 'DIAMONDS', 'XP'] })
  @ApiQuery({ name: 'type', required: false, enum: ['CREDIT', 'DEBIT', 'ADJUSTMENT'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query() query: WalletTransactionQueryDto,
  ) {
    return this.walletService.getTransactions(userId, query);
  }

  @Get('packages/diamonds')
  @Public()
  @ApiOperation({ summary: 'لیست بسته‌های الماس' })
  getDiamondPackages() {
    return this.walletService.getDiamondPackages();
  }

  @Get('packages/coins')
  @Public()
  @ApiOperation({ summary: 'لیست بسته‌های سکه' })
  getCoinPackages() {
    return this.walletService.getCoinPackages();
  }

  @Post('charge')
  @ApiOperation({ summary: 'شارژ کیف پول از درگاه پرداخت' })
  async chargeWallet(
    @CurrentUser('id') userId: string,
    @Body() dto: ChargeWalletDto,
  ) {
    return this.walletService.chargeWallet(userId, dto);
  }

  @Post('purchase-diamonds')
  @ApiOperation({ summary: 'خرید الماس با تومان' })
  async purchaseDiamonds(
    @CurrentUser('id') userId: string,
    @Body() dto: PurchaseDiamondsDto,
  ) {
    return this.walletService.purchaseDiamonds(userId, dto);
  }

  @Post('purchase-coins')
  @ApiOperation({ summary: 'خرید سکه با تومان' })
  async purchaseCoins(
    @CurrentUser('id') userId: string,
    @Body() dto: PurchaseCoinsDto,
  ) {
    return this.walletService.purchaseCoins(userId, dto);
  }

  @Post('convert')
  @ApiOperation({ summary: 'تبدیل ارز (XP → سکه)' })
  async convertCurrency(
    @CurrentUser('id') userId: string,
    @Body() dto: ConvertCurrencyDto,
  ) {
    return this.walletService.convertCurrency(userId, dto);
  }
}

// ─── Admin Wallet Controller ──────────────────────────────────────────────────

@ApiTags('Admin — Wallet')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/wallets')
export class WalletAdminController {
  constructor(private readonly walletService: WalletService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'لیست همه تراکنش‌ها' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'currency', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listTransactions(@Query() query: any) {
    return this.walletService.adminListTransactions(query);
  }

  @Post('manual-adjust')
  @ApiOperation({ summary: 'تنظیم دستی کیف پول' })
  async manualAdjust(
    @Body() dto: ManualAdjustDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.walletService.adminManualAdjust(dto, adminId);
  }
}
