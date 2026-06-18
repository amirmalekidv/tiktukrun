'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { walletApi } from '@/lib/api/wallet';

const XP_TO_COINS_RATE = 10; // 1 XP = 10 coins

interface ConvertFormProps {
  availableXp?: number;
  onSuccess?: () => void;
}

export default function ConvertForm({
  availableXp = 0,
  onSuccess,
}: ConvertFormProps) {
  const [xpAmount, setXpAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const xpNum = parseInt(
    xpAmount.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))),
    10
  ) || 0;
  const coinsResult = xpNum * XP_TO_COINS_RATE;

  const handleConvert = async () => {
    if (xpNum <= 0) {
      toast.error('مقدار XP نامعتبر است');
      return;
    }
    if (xpNum > availableXp) {
      toast.error('XP کافی ندارید');
      return;
    }
    setIsLoading(true);
    try {
      await walletApi.convertXp(xpNum);
      toast.success(`${xpNum} XP به ${coinsResult.toLocaleString('fa-IR')} سکه تبدیل شد!`);
      setXpAmount('');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در تبدیل';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-gray-900/30 rounded-xl border border-gray-800/30">
        <div className="text-center flex-1">
          <div className="text-2xl font-cinzel text-purple-400">
            {xpNum.toLocaleString('fa-IR')}
          </div>
          <div className="text-xs text-gray-500 font-vazir mt-1">XP</div>
          <i className="fas fa-bolt text-purple-500 text-xs" />
        </div>

        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-red-600"
        >
          <i className="fas fa-arrow-left text-xl" />
        </motion.div>

        <div className="text-center flex-1">
          <div className="text-2xl font-cinzel text-amber-400">
            {coinsResult.toLocaleString('fa-IR')}
          </div>
          <div className="text-xs text-gray-500 font-vazir mt-1">سکه</div>
          <i className="fas fa-circle text-amber-500 text-xs" />
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 font-vazir">
        نرخ تبدیل: هر ۱ XP = {XP_TO_COINS_RATE} سکه
      </div>

      <div>
        <label className="text-xs text-gray-400 font-vazir mb-1.5 block">
          مقدار XP برای تبدیل{' '}
          <span className="text-purple-500">
            (موجودی: {availableXp.toLocaleString('fa-IR')})
          </span>
        </label>
        <input
          type="number"
          value={xpAmount}
          onChange={(e) => setXpAmount(e.target.value)}
          className="w-full bg-gray-900/50 border border-red-900/30 rounded-xl px-4 py-3 text-gray-200 font-cinzel focus:outline-none focus:border-red-600 transition-colors"
          placeholder="مقدار XP"
          min={1}
          max={availableXp}
          dir="ltr"
        />
      </div>

      <div className="flex gap-3">
        {[100, 500, 1000].map((preset) => (
          <button
            key={preset}
            onClick={() => setXpAmount(String(preset))}
            disabled={preset > availableXp}
            className="flex-1 py-2 text-xs font-cinzel border border-purple-900/40 text-purple-400 rounded-xl hover:bg-purple-900/20 transition-colors disabled:opacity-30"
          >
            {preset} XP
          </button>
        ))}
      </div>

      <button
        onClick={handleConvert}
        disabled={isLoading || xpNum <= 0 || xpNum > availableXp}
        className="w-full py-4 bg-gradient-to-r from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600 text-white font-vazir font-bold rounded-xl transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <><i className="fas fa-spinner fa-spin ml-2" />در حال تبدیل...</>
        ) : (
          <><i className="fas fa-exchange-alt ml-2" />تبدیل XP به سکه</>
        )}
      </button>
    </div>
  );
}
