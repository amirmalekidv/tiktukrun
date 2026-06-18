'use client';
import { useState } from 'react';
import { Save, Edit, Check } from 'lucide-react';
import { SectionHeader, StatsCard } from '@/components/ui';
import { persianNum, TIER_CONFIG } from '@/lib/utils/format';
import { levelsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const INITIAL_LEVELS = Array(20).fill(0).map((_, i) => ({
  id: i + 1,
  name: ['مبتدی', 'کاوشگر', 'شکارچی', 'سایه‌نشین', 'تاریک‌خو', 'ظلمت‌پرست', 'سایه‌بان', 'غرقه در تاریکی', 'فرمانده سایه', 'اسطوره تاریک', 'نقره‌ای', 'استاد نقره', 'ارباب نقره', 'نقره افسانه', 'طلایی', 'استاد طلا', 'ارباب طلا', 'طلای افسانه', 'افسانه‌ای', 'عروج ابدی'][i],
  tier: i < 5 ? 'BRONZE' : i < 10 ? 'BRONZE' : i < 15 ? 'SILVER' : i < 18 ? 'GOLD' : 'LEGEND',
  requiredXp: (i + 1) * (i < 5 ? 500 : i < 10 ? 1500 : i < 15 ? 3000 : i < 18 ? 6000 : 12000),
  perks: i < 5 ? {} : i < 10 ? { coinBonus: 5 } : i < 15 ? { coinBonus: 10, diamondBonus: 1 } : { coinBonus: 20, diamondBonus: 5, vip: true },
}));

const TIER_RANGE: Record<string, [number, number]> = {
  BRONZE: [0, 9],
  SILVER: [10, 14],
  GOLD: [15, 17],
  LEGEND: [18, 19],
};

export default function LevelsPage() {
  const [levels, setLevels] = useState(INITIAL_LEVELS);
  const [editId, setEditId] = useState<number | null>(null);
  const [editXp, setEditXp] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEdit = (id: number, xp: number) => {
    setEditId(id);
    setEditXp(String(xp));
  };

  const handleSaveXp = (id: number) => {
    const newXp = parseInt(editXp);
    const level = levels.find(l => l.id === id);
    const prevLevel = levels.find(l => l.id === id - 1);
    if (prevLevel && newXp <= prevLevel.requiredXp) {
      toast.error('XP باید از لول قبل بیشتر باشد');
      return;
    }
    setLevels(prev => prev.map(l => l.id === id ? { ...l, requiredXp: newXp } : l));
    setEditId(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await levelsApi.updateBulk(levels.map(l => ({ id: l.id, requiredXp: l.requiredXp })));
      toast.success('همه لول‌ها ذخیره شدند');
    } catch {
      toast.error('خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت لول‌ها و XP"
        subtitle="تنظیم ۲۰ لول بازی با تیرهای برنز، نقره، طلا و افسانه"
        breadcrumb={[{ label: 'گیمیفیکیشن' }, { label: 'لول‌ها' }]}
        actions={
          <button onClick={handleSaveAll} disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" />
            ذخیره همه
          </button>
        }
      />

      {/* Level Tier Visualizer */}
      <div className="admin-card mb-6">
        <h3 className="section-title">نمای کلی لول‌ها</h3>
        <div className="relative pt-8">
          {/* Progress bar */}
          <div className="h-4 rounded-full overflow-hidden flex">
            <div className="bg-gradient-to-r from-amber-800 to-amber-600" style={{ width: '50%' }} title="برنز (۱-۱۰)" />
            <div className="bg-gradient-to-r from-slate-400 to-slate-300" style={{ width: '25%' }} title="نقره (۱۱-۱۵)" />
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-400" style={{ width: '15%' }} title="طلا (۱۶-۱۸)" />
            <div className="bg-gradient-to-r from-red-700 to-red-500" style={{ width: '10%' }} title="افسانه (۱۹-۲۰)" />
          </div>

          {/* Level dots */}
          <div className="flex mt-3 gap-1">
            {levels.map(level => {
              const tc = TIER_CONFIG[level.tier as keyof typeof TIER_CONFIG];
              return (
                <div key={level.id} className="flex-1 flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${tc.bg} ${tc.color} border border-current/30`}>
                    {level.id}
                  </div>
                  <p className="text-slate-600 text-xs mt-1 hidden md:block" style={{ fontSize: '9px' }}>
                    {(level.requiredXp / 1000).toFixed(0)}k
                  </p>
                </div>
              );
            })}
          </div>

          {/* Tier labels */}
          <div className="flex justify-between mt-2 text-xs font-bold">
            {Object.entries(TIER_CONFIG).map(([tier, config]) => (
              <span key={tier} className={config.color}>{config.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Levels Table */}
      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>لول</th>
                <th>نام</th>
                <th>تیر</th>
                <th>XP مورد نیاز</th>
                <th>مزایا</th>
                <th>ویرایش</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(level => {
                const tc = TIER_CONFIG[level.tier as keyof typeof TIER_CONFIG];
                return (
                  <tr key={level.id}>
                    <td>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${tc.bg} ${tc.color}`}>
                        {level.id}
                      </div>
                    </td>
                    <td className="text-white font-medium">{level.name}</td>
                    <td>
                      <span className={`badge ${tc.bg} ${tc.color}`}>{tc.label}</span>
                    </td>
                    <td>
                      {editId === level.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editXp}
                            onChange={e => setEditXp(e.target.value)}
                            className="input-field w-28 py-1"
                            autoFocus
                          />
                          <button onClick={() => handleSaveXp(level.id)} className="p-1.5 bg-green-600 rounded-lg text-white">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-white font-mono">{persianNum(level.requiredXp)} XP</span>
                      )}
                    </td>
                    <td>
                      <code className="text-slate-500 text-xs">
                        {Object.keys(level.perks).length > 0 ? JSON.stringify(level.perks) : '—'}
                      </code>
                    </td>
                    <td>
                      <button onClick={() => handleEdit(level.id, level.requiredXp)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
