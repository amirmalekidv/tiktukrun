'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import TransactionItem from '@/components/wallet/TransactionItem';
import { useTransactions } from '@/hooks/useWallet';

const FILTER_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'charge', label: 'شارژ' },
  { value: 'purchase', label: 'خرید' },
  { value: 'reward', label: 'جایزه' },
  { value: 'spin', label: 'گردونه' },
  { value: 'convert', label: 'تبدیل' },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const { transactions, total, isLoading } = useTransactions(page, filter || undefined);

  const totalPages = Math.ceil(total / 20);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-red-400 transition-colors">
          <i className="fas fa-arrow-right text-lg" />
        </button>
        <div>
          <h1 className="font-cinzel text-2xl text-red-500">تاریخچه تراکنش‌ها</h1>
          <p className="text-gray-500 font-vazir text-sm">کل: {total.toLocaleString('fa-IR')} تراکنش</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setFilter(opt.value); setPage(1); }}
            className={`
              px-4 py-2 rounded-xl text-sm font-vazir whitespace-nowrap transition-all
              ${filter === opt.value
                ? 'bg-red-900/40 text-red-400 border border-red-700/50'
                : 'border border-gray-800 text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="dark-card rounded-2xl p-6 border border-red-900/20 bg-[#0d0d0d]">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <i className="fas fa-receipt text-5xl text-gray-700 mb-4" />
            <p className="text-gray-500 font-vazir">تراکنشی یافت نشد</p>
          </div>
        ) : (
          <div>
            {transactions.map((tx: any, i: number) => (
              <TransactionItem key={tx.id} transaction={tx} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-red-900/30 text-red-400 rounded-xl disabled:opacity-30 font-vazir text-sm"
          >
            قبلی
          </button>
          <span className="px-4 py-2 text-gray-500 font-cinzel text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-red-900/30 text-red-400 rounded-xl disabled:opacity-30 font-vazir text-sm"
          >
            بعدی
          </button>
        </div>
      )}
    </motion.div>
  );
}
