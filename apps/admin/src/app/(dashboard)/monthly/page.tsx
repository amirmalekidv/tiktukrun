'use client';
import { useState, useEffect, useCallback } from 'react';
import { Calculator, Gift, Star, Gamepad2, Users, Loader2, RefreshCw } from 'lucide-react';
import { SectionHeader, Avatar, Modal, EmptyState } from '@/components/ui';
import { persianNum, toJalali } from '@/lib/utils/format';
import { monthlyApi } from '@/lib/api';
import toast from 'react-hot-toast';

type WinnerType = 'TOP_PLAYER' | 'TOP_TEAM' | 'TOP_GAME';

interface MonthlyWinnerRecord {
  id: string;
  year: number;
  month: number;
  type: WinnerType;
  prizeJson?: Record<string, unknown> | null;
  distributedAt?: string | null;
  winnerUser?: { id: string; fullName?: string | null; nickname?: string | null; avatarUrl?: string | null } | null;
  winnerTeam?: { id: string; name?: string | null } | null;
  winnerGame?: { id: string; title?: string | null } | null;
}

interface WinnersResult {
  year: number;
  month: number;
  topPlayer?: MonthlyWinnerRecord | null;
  topTeam?: MonthlyWinnerRecord | null;
  topGame?: MonthlyWinnerRecord | null;
  distributedAt?: string | null;
}

const PERSIAN_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

function readData<T = unknown>(res: { data?: unknown } | null | undefined): T | null {
  const d = (res as { data?: unknown } | null | undefined)?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return (d as T) ?? null;
}

function prizeText(prize?: Record<string, unknown> | null): string {
  if (!prize) return '-';
  const parts: string[] = [];
  if (prize.xp) parts.push(`${persianNum(Number(prize.xp))} XP`);
  if (prize.coins) parts.push(`${persianNum(Number(prize.coins))} سکه`);
  if (prize.diamonds) parts.push(`${persianNum(Number(prize.diamonds))} الماس`);
  if (prize.discountCode || prize.discountPercent) parts.push('کد تخفیف');
  if (prize.freeTicket) parts.push('بلیط رایگان');
  return parts.length ? parts.join(' + ') : '-';
}

export default function MonthlyPage() {
  const now = new Date();
  const [winners, setWinners] = useState<WinnersResult | null>(null);
  const [history, setHistory] = useState<MonthlyWinnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [showDistribute, setShowDistribute] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, hRes] = await Promise.all([monthlyApi.getWinners(), monthlyApi.getHistory()]);
      setWinners(readData<WinnersResult>(wRes));
      const hist = readData<MonthlyWinnerRecord[]>(hRes);
      setHistory(Array.isArray(hist) ? hist : []);
    } catch {
      toast.error('خطا در بارگذاری برندگان');
      setWinners(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCompute = async () => {
    setComputing(true);
    try {
      // compute previous month
      let y = now.getFullYear();
      let m = now.getMonth(); // 0-based current => previous month number
      if (m === 0) { m = 12; y -= 1; }
      await monthlyApi.compute(y, m);
      toast.success('برندگان ماه قبل محاسبه شدند');
      await load();
    } catch {
      toast.error('خطا در محاسبه برندگان');
    } finally {
      setComputing(false);
    }
  };

  const handleDistribute = async () => {
    if (!winners) return;
    setDistributing(true);
    try {
      await monthlyApi.distribute(winners.year, winners.month);
      toast.success('جوایز با موفقیت توزیع شدند');
      setShowDistribute(false);
      await load();
    } catch {
      toast.error('خطا در توزیع جوایز');
    } finally {
      setDistributing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
      </div>
    );
  }

  const monthLabel = winners ? `${PERSIAN_MONTHS[(winners.month - 1) % 12]} ${persianNum(winners.year)}` : '';
  const tp = winners?.topPlayer;
  const tt = winners?.topTeam;
  const tg = winners?.topGame;

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
            <button onClick={() => setShowDistribute(true)} disabled={!winners} className="btn-primary">
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
          برندگان — {monthLabel || 'ماه جاری'}
        </h3>

        {!tp && !tt && !tg ? (
          <EmptyState title="هنوز برنده‌ای محاسبه نشده" description="برای محاسبه برندگان ماه قبل، دکمه «محاسبه» را بزنید." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Player */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <h4 className="text-yellow-400 font-bold">برترین بازیکن</h4>
              </div>
              {tp?.winnerUser ? (
                <div className="flex items-center gap-3">
                  <Avatar name={tp.winnerUser.fullName ?? tp.winnerUser.nickname ?? undefined} src={tp.winnerUser.avatarUrl ?? undefined} size="lg" />
                  <div>
                    <p className="text-white font-bold">{tp.winnerUser.fullName ?? tp.winnerUser.nickname ?? 'کاربر'}</p>
                    <p className="text-slate-400 text-sm">{prizeText(tp.prizeJson)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">—</p>
              )}
            </div>

            {/* Top Team */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-400" />
                <h4 className="text-blue-400 font-bold">برترین تیم</h4>
              </div>
              {tt?.winnerTeam ? (
                <div>
                  <p className="text-white font-bold text-lg">{tt.winnerTeam.name ?? 'تیم'}</p>
                  <p className="text-slate-400 text-sm">{prizeText(tt.prizeJson)}</p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">—</p>
              )}
            </div>

            {/* Top Game */}
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Gamepad2 className="w-5 h-5 text-red-400" />
                <h4 className="text-red-400 font-bold">پربازی‌ترین بازی</h4>
              </div>
              {tg?.winnerGame ? (
                <div>
                  <p className="text-white font-bold text-lg">{tg.winnerGame.title ?? 'بازی'}</p>
                  <p className="text-slate-400 text-sm">{prizeText(tg.prizeJson)}</p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">—</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="admin-card">
        <h3 className="section-title">تاریخچه برندگان ماه</h3>
        {history.length === 0 ? (
          <EmptyState title="تاریخچه‌ای موجود نیست" />
        ) : (
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
                {history.map((w) => (
                  <tr key={w.id}>
                    <td className="text-slate-300">{persianNum(w.year)}</td>
                    <td className="text-slate-300">{PERSIAN_MONTHS[(w.month - 1) % 12]}</td>
                    <td>
                      <span className={`badge text-xs ${w.type === 'TOP_PLAYER' ? 'bg-yellow-500/20 text-yellow-400' : w.type === 'TOP_TEAM' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                        {w.type === 'TOP_PLAYER' ? 'بازیکن' : w.type === 'TOP_TEAM' ? 'تیم' : 'بازی'}
                      </span>
                    </td>
                    <td className="text-white font-medium">
                      {w.winnerUser?.fullName ?? w.winnerTeam?.name ?? w.winnerGame?.title ?? '-'}
                    </td>
                    <td className="text-slate-400 text-sm">{prizeText(w.prizeJson)}</td>
                    <td className="text-slate-400 text-sm">{w.distributedAt ? toJalali(w.distributedAt) : 'توزیع نشده'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
            <button onClick={handleDistribute} disabled={distributing} className="btn-primary">
              {distributing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              تأیید و توزیع
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            جوایز پیش‌فرض به برندگان {monthLabel} اهدا می‌شود. این عملیات سکه/الماس/XP را به حساب برندگان واریز می‌کند.
          </p>
        </div>
      </Modal>
    </div>
  );
}
