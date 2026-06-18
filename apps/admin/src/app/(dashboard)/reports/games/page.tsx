'use client';
import { useState, useEffect, useCallback } from 'react';
import { SectionHeader, StatsCard, EmptyState } from '@/components/ui';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { formatToman, persianNum, toJalali } from '@/lib/utils/format';
import { TrendingUp, Users, Star, BarChart3, RefreshCw } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartOpts = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: '#94a3b8' } },
    tooltip: { backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(71,85,105,0.15)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(71,85,105,0.15)' } },
  },
};

interface GameStat {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  rating: string;
  lastBooking: string | null;
}

// Backend admin/analytics/* return { success: true, data }
function readData<T>(res: any): T {
  const body = res?.data;
  if (body && typeof body === 'object' && 'data' in body) return body.data as T;
  return body as T;
}

export default function GamesReportPage() {
  const [games, setGames] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getGames();
      const data = readData<GameStat[]>(res);
      setGames(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در دریافت گزارش بازی‌ها');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalBookings = games.reduce((s, g) => s + (g.bookings || 0), 0);
  const totalRevenue = games.reduce((s, g) => s + (g.revenue || 0), 0);
  const topGame = games[0];
  const avgRating =
    games.length > 0
      ? (games.reduce((s, g) => s + parseFloat(g.rating || '0'), 0) / games.length).toFixed(1)
      : '0.0';

  // Top 8 by revenue for the chart
  const chartGames = games.slice(0, 8);
  const chartData = {
    labels: chartGames.map((g) => g.name),
    datasets: [
      {
        label: 'درآمد (تومان)',
        data: chartGames.map((g) => g.revenue),
        backgroundColor: 'rgba(34,197,94,0.7)',
        yAxisID: 'y',
      },
      {
        label: 'رزروها',
        data: chartGames.map((g) => g.bookings),
        backgroundColor: 'rgba(59,130,246,0.5)',
        yAxisID: 'y',
      },
    ],
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="گزارش بازی‌ها"
        subtitle="آمار درآمد، رزرو و امتیاز هر بازی"
        breadcrumb={[{ label: 'گزارش‌ها' }, { label: 'بازی‌ها' }]}
        actions={
          <button onClick={load} className="btn-secondary flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          title="داده‌ای موجود نیست"
          description="هنوز رزرو تکمیل‌شده‌ای برای محاسبه آمار بازی‌ها ثبت نشده است."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              label="بهترین بازی"
              value={topGame?.name || '—'}
              color="red"
              icon={<Star className="w-5 h-5" />}
            />
            <StatsCard
              label="کل رزروها"
              value={persianNum(totalBookings)}
              color="blue"
              icon={<Users className="w-5 h-5" />}
            />
            <StatsCard
              label="کل درآمد"
              value={formatToman(totalRevenue)}
              color="green"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatsCard
              label="میانگین امتیاز"
              value={persianNum(avgRating)}
              color="yellow"
              icon={<Star className="w-5 h-5" />}
            />
          </div>

          <div className="admin-card mb-6">
            <h3 className="section-title flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> مقایسه بازی‌ها (درآمد و رزرو)
            </h3>
            <Bar data={chartData} options={chartOpts} />
          </div>

          <div className="admin-card">
            <h3 className="section-title">جزئیات بازی‌ها</h3>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>بازی</th>
                    <th>رزروها</th>
                    <th>درآمد</th>
                    <th>امتیاز</th>
                    <th>آخرین رزرو</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id}>
                      <td className="text-white font-medium">{game.name}</td>
                      <td className="text-slate-300">{persianNum(game.bookings)}</td>
                      <td className="text-green-400 font-bold">{formatToman(game.revenue)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-white">{persianNum(game.rating)}</span>
                        </div>
                      </td>
                      <td className="text-slate-400 text-sm">
                        {game.lastBooking ? toJalali(game.lastBooking) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
