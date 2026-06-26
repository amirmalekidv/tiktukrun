'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import WalletCard from '@/components/wallet/WalletCard';
import TransactionList from '@/components/wallet/TransactionList';
import { useWallet, useTransactions } from '@/hooks/useWallet';
import { USE_MOCK } from '@/lib/http';

export default function WalletPage() {
  const { wallet, isLoading } = useWallet();
  const { transactions, isLoading: txLoading } = useTransactions(1);

  const wData = wallet as {
    tomanBalance?: number;
    diamondsBalance?: number;
    coinsBalance?: number;
  } | null;

  const w = {
    tomanBalance: wData?.tomanBalance ?? (USE_MOCK ? 285000 : 0),
    diamondsBalance: wData?.diamondsBalance ?? (USE_MOCK ? 42 : 0),
    coinsBalance: wData?.coinsBalance ?? (USE_MOCK ? 1350 : 0),
  };

  const demoTxs = [
    { id: '1', type: 'charge', amount: 200000, currency: 'toman', description: 'شارژ کیف پول', createdAt: '۱۴۰۳/۰۹/۱۵', direction: 'in' },
    { id: '2', type: 'purchase', amount: 10, currency: 'diamonds', description: 'خرید الماس x10', createdAt: '۱۴۰۳/۰۹/۱۴', direction: 'in' },
    { id: '3', type: 'spin', amount: 5, currency: 'diamonds', description: 'چرخش گردونه', createdAt: '۱۴۰۳/۰۹/۱۳', direction: 'out' },
    { id: '4', type: 'reward', amount: 500, currency: 'xp', description: 'جایزه گردونه', createdAt: '۱۴۰۳/۰۹/۱۳', direction: 'in' },
    { id: '5', type: 'purchase', amount: 85000, currency: 'toman', description: 'رزرو اتاق ترس', createdAt: '۱۴۰۳/۰۹/۱۰', direction: 'out' },
  ] as any[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-2xl text-red-500">خزانه</h1>
          <p className="text-gray-500 font-vazir text-sm mt-1">مدیریت کیف پول دیجیتال</p>
        </div>
        <Link
          href="/wallet/transactions"
          className="text-xs text-red-400 hover:text-red-300 font-vazir flex items-center gap-1 border border-red-900/30 px-3 py-1.5 rounded-lg"
        >
          همه تراکنش‌ها
          <i className="fas fa-arrow-left text-[10px]" />
        </Link>
      </div>

      {isLoading ? (
        <div className="h-64 bg-gray-900/30 rounded-2xl animate-pulse" />
      ) : (
        <WalletCard {...w} />
      )}

      <TransactionList
        transactions={transactions.length ? transactions : demoTxs}
        isLoading={txLoading}
        title="تراکنش‌های اخیر"
      />
    </motion.div>
  );
}
