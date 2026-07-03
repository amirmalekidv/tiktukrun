'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { walletApi } from '@/lib/api/wallet';
import { useAuthStore } from '@/store/auth.store';

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

interface ChargeFormProps {
  onSuccess?: () => void;
}

export default function ChargeForm({ onSuccess }: ChargeFormProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useAuthStore();

  const handleCharge = async () => {
    // Strip commas, Persian/Arabic-Indic digits, then parse
    const cleaned = amount
      .replace(/,/g, '')
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const numAmount = parseInt(cleaned, 10);
    if (!numAmount || numAmount < 10000) {
      toast.error('حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است');
      return;
    }

    setIsLoading(true);
    try {
      const { paymentUrl, message, walletBalance } = await walletApi.chargeWallet(numAmount);
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        if (typeof walletBalance === 'number' && user) {
          setUser({ ...user, walletBalance });
        }
        toast.success(message || 'شارژ کیف پول با موفقیت انجام شد');
        onSuccess?.();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در شارژ کیف پول';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset amounts */}
      <div>
        <p className="text-xs text-gray-500 font-vazir mb-3">مبالغ پیشنهادی:</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <motion.button
              key={preset}
              whileTap={{ scale: 0.96 }}
              onClick={() => setAmount(preset.toLocaleString('fa-IR'))}
              className={`
                py-2.5 rounded-xl text-sm font-cinzel border transition-all
                ${amount === preset.toLocaleString('fa-IR')
                  ? 'border-red-500 bg-red-900/30 text-red-400'
                  : 'border-red-900/30 text-gray-400 hover:border-red-700/50 hover:text-gray-300'
                }
              `}
            >
              {(preset / 1000).toLocaleString('fa-IR')}K
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div>
        <label className="text-xs text-gray-400 font-vazir mb-1.5 block">
          مبلغ دلخواه (تومان)
        </label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3.5 text-gray-200 font-cinzel text-lg focus:outline-none focus:border-red-600 transition-colors text-left"
            placeholder="100,000"
            dir="ltr"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-vazir">
            تومان
          </span>
        </div>
      </div>

      {/* ZarinPal info */}
      <div className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-xl border border-gray-800/30">
        <i className="fas fa-shield-alt text-green-500" />
        <p className="text-xs text-gray-500 font-vazir">
          پرداخت امن از طریق درگاه زرین‌پال
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={handleCharge}
        disabled={isLoading || !amount}
        className="w-full py-4 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-vazir font-bold rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
      >
        {isLoading ? (
          <><i className="fas fa-spinner fa-spin ml-2" />در حال اتصال به درگاه...</>
        ) : (
          <><i className="fas fa-credit-card ml-2" />پرداخت و شارژ</>
        )}
      </button>
    </div>
  );
}
