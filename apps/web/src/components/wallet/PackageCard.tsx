'use client';
import { motion } from 'framer-motion';

export interface Package {
  id: string;
  name: string;
  amount: number;
  currency: 'diamonds' | 'coins';
  price: number; // in toman
  bonus?: number;
  popular?: boolean;
}

const CURRENCY_STYLE = {
  diamonds: {
    icon: 'fa-gem',
    color: '#22d3ee',
    bg: 'from-cyan-950/50 to-[#0d0d0d]',
    border: 'border-cyan-800/40',
    hoverBorder: 'hover:border-cyan-600/60',
  },
  coins: {
    icon: 'fa-circle',
    color: '#f59e0b',
    bg: 'from-amber-950/50 to-[#0d0d0d]',
    border: 'border-amber-800/40',
    hoverBorder: 'hover:border-amber-600/60',
  },
};

interface PackageCardProps {
  pkg: Package;
  onBuy: (pkg: Package) => void;
  isLoading?: boolean;
}

export default function PackageCard({ pkg, onBuy, isLoading }: PackageCardProps) {
  const style = CURRENCY_STYLE[pkg.currency];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative bg-gradient-to-br ${style.bg} border-2 ${style.border} ${style.hoverBorder} rounded-2xl p-5 transition-all`}
    >
      {/* Popular badge */}
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-700 to-red-500 text-white text-xs font-cinzel px-3 py-1 rounded-full shadow-lg">
          ⭐ پرفروش
        </div>
      )}

      <div className="text-center">
        {/* Icon & Amount */}
        <div
          className="text-4xl mb-2"
          style={{ color: style.color, filter: `drop-shadow(0 0 8px ${style.color}60)` }}
        >
          <i className={`fas ${style.icon}`} />
        </div>
        <div className="font-cinzel text-2xl font-bold mb-1" style={{ color: style.color }}>
          {pkg.amount.toLocaleString('fa-IR')}
        </div>
        <div className="text-gray-400 font-vazir text-sm mb-1">{pkg.name}</div>

        {/* Bonus */}
        {pkg.bonus && pkg.bonus > 0 && (
          <div className="inline-block bg-green-900/30 text-green-400 text-xs font-vazir px-2 py-0.5 rounded-full mb-3 border border-green-800/30">
            + {pkg.bonus.toLocaleString('fa-IR')} جایزه
          </div>
        )}

        {/* Price */}
        <div className="text-red-500 font-cinzel font-bold text-lg mb-4">
          {pkg.price.toLocaleString('fa-IR')} تومان
        </div>

        {/* Buy button */}
        <button
          onClick={() => !isLoading && onBuy(pkg)}
          className="w-full py-2.5 rounded-xl font-vazir text-sm font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: `${style.color}20`,
            border: `1px solid ${style.color}40`,
            color: style.color,
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin" />
          ) : (
            <>
              <i className="fas fa-shopping-cart ml-1.5 text-xs" />
              خرید
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
