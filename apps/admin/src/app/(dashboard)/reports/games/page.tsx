'use client';
import { SectionHeader, StatsCard } from '@/components/ui';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { formatToman, persianNum } from '@/lib/utils/format';
import { TrendingUp, Users, Star, Percent } from 'lucide-react';

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

const GAME_NAMES = ['اتاق فرار تاریک', 'لیزرتگ پرو', 'VR ماجرا', 'پینت‌بال', 'بردگیم'];

const roiData = {
  labels: GAME_NAMES,
  datasets: [
    { label: 'درآمد (میلیون)', data: [45, 32, 28, 19, 25], backgroundColor: 'rgba(34,197,94,0.7)' },
    { label: 'نرخ اشغال (%)', data: [85, 70, 75, 60, 65], backgroundColor: 'rgba(59,130,246,0.5)' },
  ],
};

const MOCK_GAMES_ROI = GAME_NAMES.map((name, i) => ({
  name,
  category: ['اتاق فرار', 'لیزرتگ', 'VR', 'پینت‌بال', 'بردگیم'][i],
  totalBookings: (i + 1) * 45 + 20,
  revenue: String((i + 1) * 9000000 + 5000000),
  avgRating: (4.0 + Math.random() * 0.8).toFixed(1),
  occupancyRate: 60 + i * 5,
  roi: 150 + i * 30,
}));

export default function GamesReportPage() {
  return (
    <div className="fade-in">
      <SectionHeader
        title="گزارش بازی‌ها"
        subtitle="آمار ROI، اشغال و عملکرد هر بازی"
        breadcrumb={[{ label: 'گزارش‌ها' }, { label: 'بازی‌ها' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard label="بهترین بازی" value="اتاق فرار تاریک" color="red" icon={<Star className="w-5 h-5" />} />
        <StatsCard label="کل رزروها" value={persianNum(842)} color="blue" icon={<Users className="w-5 h-5" />} />
        <StatsCard label="میانگین ROI" value="۲۱۰٪" color="green" icon={<TrendingUp className="w-5 h-5" />} />
        <StatsCard label="میانگین اشغال" value="۷۱٪" color="yellow" icon={<Percent className="w-5 h-5" />} />
      </div>

      <div className="admin-card mb-6">
        <h3 className="section-title">مقایسه بازی‌ها</h3>
        <Bar data={roiData} options={chartOpts} />
      </div>

      <div className="admin-card">
        <h3 className="section-title">جزئیات ROI بازی‌ها</h3>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>بازی</th>
                <th>دسته</th>
                <th>رزروها</th>
                <th>درآمد</th>
                <th>امتیاز</th>
                <th>نرخ اشغال</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_GAMES_ROI.map((game, i) => (
                <tr key={i}>
                  <td className="text-white font-medium">{game.name}</td>
                  <td className="text-slate-400">{game.category}</td>
                  <td className="text-slate-300">{persianNum(game.totalBookings)}</td>
                  <td className="text-green-400 font-bold">{formatToman(game.revenue)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-white">{game.avgRating}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2 w-24">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${game.occupancyRate}%` }} />
                      </div>
                      <span className="text-slate-300 text-sm">{game.occupancyRate}٪</span>
                    </div>
                  </td>
                  <td>
                    <span className={`font-bold ${game.roi > 200 ? 'text-green-400' : game.roi > 150 ? 'text-yellow-400' : 'text-slate-300'}`}>
                      {game.roi}٪
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
