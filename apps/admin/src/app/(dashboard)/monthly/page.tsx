'use client';
import { useState } from 'react';
import { Calculator, Gift, Star, Gamepad2, Users, Loader2 } from 'lucide-react';
import { SectionHeader, StatsCard, Avatar, Modal } from '@/components/ui';
import { persianNum, toJalali, formatToman } from '@/lib/utils/format';
import { monthlyApi } from '@/lib/api';
import toast from 'react-hot-toast';

const MOCK_CURRENT = {
  topPlayer: { user: { name: 'علی احمدی', avatar: undefined }, bookings: 12, xp: 3400 },
  topTeam: { team: { name: 'تیم Shadow Warriors' }, wins: 8, members: 5 },
  topGame: { game: { title: 'اتاق فرار تاریک' }, bookings: 87, rating: 4.8 },
  month: 'خرداد ۱۴۰۳',
};

const MOCK_HISTORY = [
  { id: 'mw1', year: 1403, month: 2, type: 'TOP_PLAYER', winner: 'رضا کریمی', prize: '۱۰۰۰ الماس + تروفی طلا', distributedAt: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: 'mw2', year: 1403, month: 2, type: 'TOP_TEAM', winner: 'تیم دارک مود', prize: '۵۰۰ الماس + بج ماه', distributedAt: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: 'mw3', year: 1403, month: 2, type: 'TOP_GAME', winner: 'لیزرتگ پرو', prize: 'نمایش ویژه در سایت', distributedAt: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: 'mw4', year: 1403, month: 1, type: 'TOP_PLAYER', winner: 'سارا محمدی', prize: '۱۰۰۰ الماس + تروفی طلا', distributedAt: new Date(Date.now() - 86400000 * 60).toISOString() },
];

export default function MonthlyPage() {
  const [computing, setComputing] = useState(false);
  const [showDistribute, setShowDistribute] = useState(false);
  const [customPrizes, setCustomPrizes] = useState({
    topPlayer: '۱۰۰۰ الماس + تروفی طلا',
    topTeam: '۵۰۰ الماس + بج ماه',
    topGame: 'نمایش ویژه در سایت',
  });

  const handleCompute = async () => {
    setComputing(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      toast.success('برندگان ماه قبل محاسبه شدند');
    } catch {
      toast.error('خطا');
    } finally {
      setComputing(false);
    }
  };

  const handleDistribute = async () => {
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success('جوایز با موفقیت توزیع شدند');
      setShowDistribute(false);
    } catch {
      toast.error('خطا');
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="برندگان ماهانه"
        subtitle="محاسبه و توزیع جوایز ماهانه"
        breadcrumb={[{ label: 'گیمیفیکیشن' }, { label: 'ماهانه' }]}
        actions={
          <div className="flex gap-2">
            <button onClick={handleCompute} disabled={computing} className="btn-secondary">
              {computing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              محاسبه برندگان ماه قبل
            </button>
            <button onClick={() => setShowDistribute(true)} className="btn-primary">
              <Gift className="w-4 h-4" />
              توزیع جوایز
            </button>
          </div>
        }
      />

      {/* Current Month Leaders */}
      <div className="admin-card mb-6">
        <h3 className="section-title flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          لیدربورد زنده — {MOCK_CURRENT.month}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Player */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <h4 className="text-yellow-400 font-bold">برترین بازیکن</h4>
            </div>
            <div className="flex items-center gap-3">
              <Avatar name={MOCK_CURRENT.topPlayer.user.name} size="lg" />
              <div>
                <p className="text-white font-bold">{MOCK_CURRENT.topPlayer.user.name}</p>
                <p className="text-slate-400 text-sm">{persianNum(MOCK_CURRENT.topPlayer.bookings)} رزرو | {persianNum(MOCK_CURRENT.topPlayer.xp)} XP</p>
              </div>
            </div>
          </div>

          {/* Top Team */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-blue-400" />
              <h4 className="text-blue-400 font-bold">برترین تیم</h4>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{MOCK_CURRENT.topTeam.team.name}</p>
              <p className="text-slate-400 text-sm">{persianNum(MOCK_CURRENT.topTeam.wins)} پیروزی | {persianNum(MOCK_CURRENT.topTeam.members)} عضو</p>
            </div>
          </div>

          {/* Top Game */}
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="w-5 h-5 text-red-400" />
              <h4 className="text-red-400 font-bold">پربازی‌ترین بازی</h4>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{MOCK_CURRENT.topGame.game.title}</p>
              <p className="text-slate-400 text-sm">{persianNum(MOCK_CURRENT.topGame.bookings)} رزرو | ⭐ {MOCK_CURRENT.topGame.rating}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="admin-card">
        <h3 className="section-title">تاریخچه برندگان ماه</h3>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>سال</th>
                <th>ماه</th>
                <th>نوع</th>
                <th>برنده</th>
                <th>جایزه</th>
                <th>توزیع شده در</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HISTORY.map(w => (
                <tr key={w.id}>
                  <td className="text-slate-300">{persianNum(w.year)}</td>
                  <td className="text-slate-300">{['فروردین', 'اردیبهشت', 'خرداد'][w.month - 1]}</td>
                  <td>
                    <span className={`badge text-xs ${w.type === 'TOP_PLAYER' ? 'bg-yellow-500/20 text-yellow-400' : w.type === 'TOP_TEAM' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                      {w.type === 'TOP_PLAYER' ? 'بازیکن' : w.type === 'TOP_TEAM' ? 'تیم' : 'بازی'}
                    </span>
                  </td>
                  <td className="text-white font-medium">{w.winner}</td>
                  <td className="text-slate-400 text-sm">{w.prize}</td>
                  <td className="text-slate-400 text-sm">{toJalali(w.distributedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribute Modal */}
      <Modal
        open={showDistribute}
        onClose={() => setShowDistribute(false)}
        title="توزیع جوایز ماهانه"
        size="md"
        footer={
          <>
            <button onClick={() => setShowDistribute(false)} className="btn-secondary">انصراف</button>
            <button onClick={handleDistribute} className="btn-primary">
              <Gift className="w-4 h-4" />
              تأیید و توزیع
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">جوایز زیر به برندگان ماه اردیبهشت ۱۴۰۳ اهدا می‌شود:</p>
          <div className="space-y-3">
            {[
              { key: 'topPlayer', label: '🌟 برترین بازیکن' },
              { key: 'topTeam', label: '👥 برترین تیم' },
              { key: 'topGame', label: '🎮 پربازی‌ترین بازی' },
            ].map(item => (
              <div key={item.key}>
                <label className="label-field">{item.label}</label>
                <input
                  type="text"
                  value={customPrizes[item.key as keyof typeof customPrizes]}
                  onChange={e => setCustomPrizes(prev => ({ ...prev, [item.key]: e.target.value }))}
                  className="input-field"
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
