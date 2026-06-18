'use client';
import { motion } from 'framer-motion';

interface BalanceTileProps {
  currency: 'toman' | 'diamonds' | 'coins';
  amount: number;
  label?: string;
}

const CURRENCY_CONFIG = {
  toman: {
    icon: 'fa-coins',
    color: '#dc2626',
    bg: 'from-red-950/40 to-red-900/10',
    border: 'border-red-900/40',
    label: 'تومان',
    formatter: (n: number) => n.toLocaleString('fa-IR') + ' تومان',
  },
  diamonds: {
    icon: 'fa-gem',
    color: '#22d3ee',
    bg: 'from-cyan-950/40 to-cyan-900/10',
    border: 'border-cyan-900/40',
    label: 'الماس',
    formatter: (n: number) => n.toLocaleString('fa-IR') + ' الماس',
  },
  coins: {
    icon: 'fa-circle',
    color: '#f59e0b',
    bg: 'from-amber-950/40 to-amber-900/10',
    border: 'border-amber-900/40',
    label: 'سکه',
    formatter: (n: number) => n.toLocaleString('fa-IR') + ' سکه',
  },
};

export default function BalanceTile({ currency, amount, label }: BalanceTileProps) {
  const cfg = CURRENCY_CONFIG[currency];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${cfg.bg} border ${cfg.border} rounded-xl p-4 flex items-center gap-3`}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{
          background: cfg.color + '20',
          color: cfg.color,
          boxShadow: `0 0 16px ${cfg.color}30`,
        }}
      >
        <i className={`fas ${cfg.icon}`} />
      </div>
      <div>
        <div className="text-xs text-gray-500 font-vazir mb-0.5">
          {label ?? cfg.label}
        </div>
        <div
          className="text-xl font-cinzel font-bold"
          style={{ color: cfg.color }}
        >
          {cfg.formatter(amount)}
        </div>
      </div>
    </motion.div>
  );
}
