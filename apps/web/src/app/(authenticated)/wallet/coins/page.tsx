'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PackageCard, { Package } from '@/components/wallet/PackageCard';
import { walletApi } from '@/lib/api/wallet';

const DEMO_PACKAGES: Package[] = [
  { id: 'c1', name: 'بسته کوچک', amount: 500, currency: 'coins', price: 15000 },
  { id: 'c2', name: 'بسته متوسط', amount: 1500, currency: 'coins', price: 40000, bonus: 100, popular: true },
  { id: 'c3', name: 'بسته بزرگ', amount: 5000, currency: 'coins', price: 120000, bonus: 500 },
  { id: 'c4', name: 'بسته مگا', amount: 10000, currency: 'coins', price: 220000, bonus: 1500 },
];

type RawCoinPackage = {
  id: string;
  label?: string;
  name?: string;
  coins?: number;
  amount?: number;
  priceToman?: number;
  price?: number;
  bonus?: number;
  popular?: boolean;
};

function normalizeCoinPackage(raw: RawCoinPackage): Package {
  return {
    id: raw.id,
    name: raw.label ?? raw.name ?? 'بسته سکه',
    amount: Number(raw.coins ?? raw.amount ?? 0),
    currency: 'coins',
    price: Number(raw.priceToman ?? raw.price ?? 0),
    bonus: raw.bonus,
    popular: raw.popular,
  };
}

export default function CoinsPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>(DEMO_PACKAGES);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    walletApi.getCoinPackages().then((raw) => {
      const d = raw as { packages?: RawCoinPackage[] } | RawCoinPackage[];
      const list = Array.isArray(d) ? d : d?.packages;
      if (list?.length) setPackages(list.map(normalizeCoinPackage));
    }).catch(() => {});
  }, []);

  const handleBuy = async (pkg: Package) => {
    setLoadingId(pkg.id);
    try {
      await walletApi.purchaseCoins(pkg.id);
      toast.success(`${pkg.amount.toLocaleString('fa-IR')} سکه به کیف پول اضافه شد!`);
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
          <h1 className="font-cinzel text-2xl text-amber-400">خرید سکه</h1>
          <p className="text-gray-500 font-vazir text-sm">سکه برای گردونه و جوایز</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} onBuy={handleBuy} isLoading={loadingId === pkg.id} />
        ))}
      </div>
    </motion.div>
  );
}
