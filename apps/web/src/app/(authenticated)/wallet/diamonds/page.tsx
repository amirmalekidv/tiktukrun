'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PackageCard, { Package } from '@/components/wallet/PackageCard';
import { walletApi } from '@/lib/api/wallet';

const DEMO_PACKAGES: Package[] = [
  { id: 'd1', name: 'بسته کوچک', amount: 10, currency: 'diamonds', price: 25000 },
  { id: 'd2', name: 'بسته متوسط', amount: 50, currency: 'diamonds', price: 110000, bonus: 5, popular: true },
  { id: 'd3', name: 'بسته بزرگ', amount: 100, currency: 'diamonds', price: 200000, bonus: 15 },
  { id: 'd4', name: 'بسته مگا', amount: 250, currency: 'diamonds', price: 450000, bonus: 50 },
  { id: 'd5', name: 'بسته اولتیمیت', amount: 500, currency: 'diamonds', price: 800000, bonus: 120 },
  { id: 'd6', name: 'بسته لجند', amount: 1000, currency: 'diamonds', price: 1500000, bonus: 300 },
];

export default function DiamondsPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>(DEMO_PACKAGES);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    walletApi.getDiamondPackages().then((raw) => {
      const d = raw as { packages?: Package[] } | Package[];
      const list = Array.isArray(d) ? d : d?.packages;
      if (list?.length) setPackages(list as Package[]);
    }).catch(() => {});
  }, []);

  const handleBuy = async (pkg: Package) => {
    setLoadingId(pkg.id);
    try {
      await walletApi.purchasePackage(pkg.id);
      toast.success(`${pkg.amount} الماس به کیف پول اضافه شد!`);
      router.push('/wallet');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در خرید';
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-red-400 transition-colors">
          <i className="fas fa-arrow-right text-lg" />
        </button>
        <div>
          <h1 className="font-cinzel text-2xl text-cyan-400">خرید الماس</h1>
          <p className="text-gray-500 font-vazir text-sm">الماس برای آیتم‌های آواتار و گردونه</p>
        </div>
      </div>

      <div className="p-4 bg-cyan-950/20 border border-cyan-900/30 rounded-xl flex items-center gap-3">
        <i className="fas fa-info-circle text-cyan-500" />
        <p className="text-xs text-gray-400 font-vazir">
          خرید از موجودی تومان کیف پول انجام می‌شود. در صورت کمبود موجودی ابتدا کیف پول شارژ کنید.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            onBuy={handleBuy}
            isLoading={loadingId === pkg.id}
          />
        ))}
      </div>
    </motion.div>
  );
}
