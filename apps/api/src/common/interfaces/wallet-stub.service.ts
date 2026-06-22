/**
 * WalletService (stub-bridge) — کسر/اضافه موجودی تومانی روی مدل Wallet واقعی
 * نسخه MongoDB: id ها String هستند و مبالغ Int.
 */
import { Injectable, Logger } from '@nestjs/common';
import { WalletTxType } from '@tiktakrun/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

export interface IWalletService {
  applyTransaction(params: WalletTransactionParams): Promise<WalletTransactionResult>;
  getBalance(userId: string): Promise<bigint>;
}

export interface WalletTransactionParams {
  userId: string;
  amount: bigint;
  type: WalletTxType;
  description: string;
  refId?: string;
}

export interface WalletTransactionResult {
  transactionId: string;
  newBalance: bigint;
}

@Injectable()
export class WalletService implements IWalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string): Promise<bigint> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { tomanBalance: true },
    });
    return BigInt(wallet?.tomanBalance ?? 0);
  }

  async applyTransaction(
    params: WalletTransactionParams,
  ): Promise<WalletTransactionResult> {
    const amount = Number(params.amount);
    return this.prisma.$transaction(async (tx) => {
      // اطمینان از وجود کیف پول
      const wallet = await tx.wallet.upsert({
        where:  { userId: params.userId },
        update: { tomanBalance: { increment: amount } },
        create: { userId: params.userId, tomanBalance: amount },
        select: { id: true, tomanBalance: true },
      });

      const record = await tx.transaction.create({
        data: {
          walletId:     wallet.id,
          currency:     'TOMAN',
          amount,
          balanceAfter: wallet.tomanBalance,
          type:         'MANUAL_ADJUST',
          description:  params.description,
          refType:      params.type,
          refId:        params.refId,
        },
      });

      this.logger.log(
        `Wallet TX: user=${params.userId} amount=${amount} type=${params.type}`,
      );

      return { transactionId: record.id, newBalance: BigInt(wallet.tomanBalance) };
    });
  }
}
