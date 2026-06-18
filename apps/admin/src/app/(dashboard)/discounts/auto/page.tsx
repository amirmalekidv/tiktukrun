'use client';
import { useState } from 'react';
import { Edit, Users } from 'lucide-react';
import { SectionHeader, Toggle, Modal } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const MOCK_AUTO_DISCOUNTS = [
  { id: 'ad1', name: 'تخفیف VIP', trigger: 'VIP', type: 'PERCENT', value: 15, conditions: { minLevel: 10 }, isActive: true, matchingUsersCount: 245, description: 'به کاربران VIP به‌صورت خودکار تخفیف داده می‌شود' },
  { id: 'ad2', name: 'تخفیف هفتگی', trigger: 'WEEKLY', type: 'PERCENT', value: 10, conditions: { daysOfWeek: [4, 5] }, isActive: true, matchingUsersCount: null, description: 'در روزهای چهارشنبه و پنجشنبه برای همه کاربران' },
  { id: 'ad3', name: 'اولین رزرو', trigger: 'FIRST_BOOKING', type: 'PERCENT', value: 20, conditions: { maxBookings: 0 }, isActive: true, matchingUsersCount: null, description: 'برای کاربران جدید که هنوز رزرو نکرده‌اند' },
  { id: 'ad4', name: 'تخفیف تولد', trigger: 'BIRTHDAY', type: 'PERCENT', value: 30, conditions: { daysBefore: 7, daysAfter: 7 }, isActive: false, matchingUsersCount: 18, description: 'در روز تولد و ۷ روز اطراف آن' },
  { id: 'ad5', name: 'پاداش دعوت', trigger: 'INVITE', type: 'FIXED', value: 50000, conditions: { minInvites: 1 }, isActive: true, matchingUsersCount: 89, description: 'برای هر دعوت موفق یک رزرو رایگان' },
];

const TRIGGER_LABELS: Record<string, string> = {
  VIP: '👑 VIP', WEEKLY: '📅 هفتگی', FIRST_BOOKING: '🎯 اولین رزرو', BIRTHDAY: '🎂 تولد', INVITE: '🤝 دعوت',
};

export default function AutoDiscountsPage() {
  const [discounts, setDiscounts] = useState(MOCK_AUTO_DISCOUNTS);
  const [editId, setEditId] = useState<string | null>(null);

  const editDiscount = discounts.find(d => d.id === editId);

  return (
    <div className="fade-in">
      <SectionHeader
        title="تخفیف‌های خودکار"
        subtitle="تخفیف‌هایی که به‌صورت خودکار اعمال می‌شوند"
        breadcrumb={[{ label: 'تخفیف‌ها' }, { label: 'خودکار' }]}
      />

      <div className="space-y-4">
        {discounts.map(discount => (
          <div key={discount.id} className={`admin-card transition-all ${discount.isActive ? 'border-slate-700/50' : 'border-slate-800 opacity-60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{TRIGGER_LABELS[discount.trigger]?.split(' ')[0]}</div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-bold text-lg">{discount.name}</h3>
                    <span className="badge bg-slate-700 text-slate-300 text-xs">{TRIGGER_LABELS[discount.trigger]?.split(' ').slice(1).join(' ')}</span>
                    <span className={`badge ${discount.type === 'PERCENT' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                      {discount.type === 'PERCENT' ? `${persianNum(discount.value)}٪` : `${persianNum(discount.value)} تومان`}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{discount.description}</p>
                  {discount.matchingUsersCount !== null && (
                    <div className="flex items-center gap-1 mt-2">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-500 text-xs">{persianNum(discount.matchingUsersCount)} کاربر واجد شرایط</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setEditId(discount.id)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <Toggle
                  checked={discount.isActive}
                  onChange={() => setDiscounts(prev => prev.map(d => d.id === discount.id ? { ...d, isActive: !d.isActive } : d))}
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700/30">
              <p className="text-slate-500 text-xs">شرایط: <code className="text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">{JSON.stringify(discount.conditions)}</code></p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!editId}
        onClose={() => setEditId(null)}
        title={`ویرایش: ${editDiscount?.name}`}
        size="md"
        footer={
          <>
            <button onClick={() => setEditId(null)} className="btn-secondary">انصراف</button>
            <button onClick={() => { toast.success('ذخیره شد'); setEditId(null); }} className="btn-primary">ذخیره</button>
          </>
        }
      >
        {editDiscount && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">نوع تخفیف</label>
                <select defaultValue={editDiscount.type} className="select-field">
                  <option value="PERCENT">درصدی</option>
                  <option value="FIXED">مبلغ ثابت</option>
                </select>
              </div>
              <div>
                <label className="label-field">مقدار</label>
                <input type="number" defaultValue={editDiscount.value} className="input-field" />
              </div>
            </div>
            <div>
              <label className="label-field">شرایط (JSON)</label>
              <textarea
                defaultValue={JSON.stringify(editDiscount.conditions, null, 2)}
                className="input-field font-mono text-sm h-24 resize-none"
                dir="ltr"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
