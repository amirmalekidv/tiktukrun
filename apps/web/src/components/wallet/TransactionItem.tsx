'use client';
import { motion } from 'framer-motion';

export interface Transaction {
  id: string;
  type: 'charge' | 'purchase' | 'reward' | 'spin' | 'convert' | 'refund';
  amount: number;
  currency: 'toman' | 'diamonds' | 'coins' | 'xp';
  description: string;
  createdAt: string;
  direction: 'in' | 'out';
}

const TYPE_CONFIG = {
  charge: { icon: 'fa-plus-circle', label: 'شارژ' },
  purchase: { icon: 'fa-shopping-cart', label: 'خرید' },
  reward: { icon: 'fa-gift', label: 'جایزه' },
  spin: { icon: 'fa-dharmachakra', label: 'گردونه' },
  convert: { icon: 'fa-exchange-alt', label: 'تبدیل' },
  refund: { icon: 'fa-undo', label: 'بازپرداخت' },
};

const CURRENCY_ICONS = {
  toman: { icon: 'fa-coins', color: '#00f5ff' },
  diamonds: { icon: 'fa-gem', color: '#22d3ee' },
  coins: { icon: 'fa-circle', color: '#f59e0b' },
  xp: { icon: 'fa-bolt', color: '#8b5cf6' },
};

interface TransactionItemProps {
  transaction: Transaction;
  index?: number;
}

export default function TransactionItem({
  transaction,
  index = 0,
}: TransactionItemProps) {
  const typeConfig = TYPE_CONFIG[transaction.type] ?? { icon: 'fa-circle', label: transaction.type };
  const currencyConfig = CURRENCY_ICONS[transaction.currency] ?? { icon: 'fa-circle', color: '#888' };
  const isIn = transaction.direction === 'in';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-4 py-3 border-b border-white/10 last:border-b-0"
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
        style={{
          background: currencyConfig.color + '15',
          color: currencyConfig.color,
        }}
      >
        <i className={`fas ${typeConfig.icon}`} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-300 font-vazir truncate">
          {transaction.description}
        </div>
        <div className="text-xs text-gray-600 font-vazir mt-0.5">
          {typeConfig.label} · {transaction.createdAt}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <div
          className={`font-cinzel font-bold text-sm flex items-center gap-1 ${
            isIn ? 'text-[#2ee6a0]' : 'text-[#ff5470]'
          }`}
        >
          {isIn ? '+' : '-'}
          {transaction.amount.toLocaleString('fa-IR')}
          <i
            className={`fas ${currencyConfig.icon} text-xs`}
            style={{ color: currencyConfig.color }}
          />
        </div>
      </div>
    </motion.div>
  );
}
