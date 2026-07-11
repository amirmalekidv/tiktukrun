'use client';
import TransactionItem, { Transaction } from './TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  title?: string;
}

export default function TransactionList({
  transactions,
  isLoading,
  title = 'تراکنش‌های اخیر',
}: TransactionListProps) {
  return (
    <div className="dark-card rounded-[18px] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cinzel text-[#00f5ff] flex items-center gap-2">
          <i className="fas fa-list" />
          {title}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10">
          <i className="fas fa-receipt text-4xl text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm font-vazir">تراکنشی وجود ندارد</p>
        </div>
      ) : (
        <div>
          {transactions.map((tx, i) => (
            <TransactionItem key={tx.id} transaction={tx} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
