'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AvatarItemCard, { AvatarItem } from './AvatarItemCard';
import AvatarPreview, { AvatarConfig } from './AvatarPreview';
import { profileApi } from '@/lib/api/profile';

type TabType = 'hat' | 'glasses' | 'skin' | 'effect' | 'background';

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'hat', label: 'کلاه', icon: 'fa-hat-wizard' },
  { key: 'glasses', label: 'عینک', icon: 'fa-glasses' },
  { key: 'skin', label: 'پوست', icon: 'fa-palette' },
  { key: 'effect', label: 'افکت', icon: 'fa-magic' },
  { key: 'background', label: 'پس‌زمینه', icon: 'fa-image' },
];

interface AvatarCustomizerProps {
  initialConfig?: AvatarConfig;
  initialItems?: AvatarItem[];
  onSave?: () => void;
}

export default function AvatarCustomizer({
  initialConfig = {},
  initialItems = [],
  onSave,
}: AvatarCustomizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('hat');
  const [config, setConfig] = useState<AvatarConfig>(initialConfig);
  const [items, setItems] = useState<AvatarItem[]>(initialItems);
  const [isSaving, setIsSaving] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState<AvatarItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    profileApi.getAvatarItems()
      .then((d) => { if (d?.items) setItems(d.items); })
      .catch(() => {}); // keep demo empty state on failure
    profileApi.getAvatarConfig()
      .then((d) => { if (d?.config) setConfig(d.config); })
      .catch(() => {});
  }, []);

  const filteredItems = items.filter((i) => i.type === activeTab);

  const handleSelect = (item: AvatarItem) => {
    setConfig((prev) => ({ ...prev, [item.type]: item.id }));
    // Mark as active in items list
    setItems((prev) =>
      prev.map((i) =>
        i.type === item.type
          ? { ...i, status: i.id === item.id ? 'active' : i.status === 'active' ? 'purchased' : i.status }
          : i
      )
    );
  };

  const handlePurchaseClick = (item: AvatarItem) => {
    setPurchaseTarget(item);
    setShowConfirm(true);
  };

  const confirmPurchase = async () => {
    if (!purchaseTarget) return;
    try {
      await profileApi.purchaseAvatarItem(purchaseTarget.id);
      setItems((prev) =>
        prev.map((i) =>
          i.id === purchaseTarget.id ? { ...i, status: 'purchased' } : i
        )
      );
      toast.success(`${purchaseTarget.name} خریداری شد!`);
      setShowConfirm(false);
      setPurchaseTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در خرید';
      toast.error(msg);
      setShowConfirm(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await profileApi.updateAvatarConfig(config);
      toast.success('تنظیمات آواتار ذخیره شد!');
      onSave?.();
    } catch {
      toast.error('خطا در ذخیره آواتار');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Preview */}
      <div className="lg:col-span-1">
        <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-[#0d0d0d] flex flex-col items-center gap-6">
          <h3 className="font-cinzel text-red-500 text-sm">پیش‌نمایش زنده</h3>
          <AvatarPreview config={config} size="lg" />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-vazir rounded-xl transition-all disabled:opacity-50 font-bold"
          >
            {isSaving ? (
              <><i className="fas fa-spinner fa-spin ml-2" />در حال ذخیره...</>
            ) : (
              <><i className="fas fa-save ml-2" />ذخیره تغییرات</>
            )}
          </button>
        </div>
      </div>

      {/* Item selector */}
      <div className="lg:col-span-2">
        <div className="dark-card rounded-2xl p-6 border border-red-900/30 bg-[#0d0d0d]">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-vazir whitespace-nowrap transition-all
                  ${activeTab === tab.key
                    ? 'bg-red-900/40 text-red-400 border border-red-700/50'
                    : 'text-gray-500 border border-transparent hover:text-gray-300'
                  }
                `}
              >
                <i className={`fas ${tab.icon} text-xs`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-3 sm:grid-cols-4 gap-3"
            >
              {filteredItems.length === 0 ? (
                <div className="col-span-4 text-center py-8 text-gray-600 font-vazir text-sm">
                  هیچ آیتمی یافت نشد
                </div>
              ) : (
                filteredItems.map((item) => (
                  <AvatarItemCard
                    key={item.id}
                    item={item}
                    onPurchase={handlePurchaseClick}
                    onSelect={handleSelect}
                    isSelected={config[item.type] === item.id}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Purchase Confirm Modal */}
      <AnimatePresence>
        {showConfirm && purchaseTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0d0d0d] border border-red-900/50 rounded-2xl p-6 max-w-sm w-full text-center"
            >
              <i className="fas fa-gem text-4xl text-cyan-400 mb-4" />
              <h3 className="font-cinzel text-white text-lg mb-2">خرید آیتم</h3>
              <p className="font-vazir text-gray-300 text-sm mb-2">
                {purchaseTarget.name}
              </p>
              <p className="font-vazir text-gray-500 text-sm mb-6">
                هزینه:{' '}
                <span className="text-cyan-400 font-bold">
                  {purchaseTarget.diamondCost} الماس
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmPurchase}
                  className="flex-1 py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl font-vazir text-sm transition-colors"
                >
                  تأیید خرید
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl font-vazir text-sm hover:bg-gray-900 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
