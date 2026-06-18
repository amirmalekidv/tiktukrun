'use client';
import { useParams } from 'next/navigation';
import { SectionHeader, StatsCard } from '@/components/ui';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend
} from 'chart.js';
import { TrendingUp, Users, Star, CreditCard } from 'lucide-react';
import { formatToman, persianNum } from '@/lib/utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: '#94a3b8', font: { family: 'Vazirmatn' } } },
    tooltip: { backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(71,85,105,0.2)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(71,85,105,0.2)' } },
  },
};

const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

export default function GameStatsPage() {
  const params = useParams();
  const id = params.id as string;

  const bookingData = {
    labels: months,
    datasets: [{
      label: 'تعداد رزروها',
      data: [12, 19, 15, 25, 22, 30, 28, 35, 31, 40, 38, 45],
      backgroundColor: 'rgba(220, 38, 38, 0.7)',
      borderColor: '#dc2626',
      borderWidth: 1,
    }],
  };

  const revenueData = {
    labels: months,
    datasets: [{
      label: 'درآمد (میلیون تومان)',
      data: [3, 4.5, 3.8, 6.2, 5.5, 7.5, 7, 8.7, 7.8, 10, 9.5, 11.2],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const stats = [
    { label: 'کل رزروها', value: persianNum(347), subValue: 'از ابتدا', icon: <Users className="w-5 h-5" />, color: 'blue' as const },
    { label: 'درآمد کل', value: formatToman('86750000'), subValue: 'این بازی', icon: <CreditCard className="w-5 h-5" />, color: 'green' as const },
    { label: 'میانگین امتیاز', value: '۴.۳', subValue: 'از ۵', icon: <Star className="w-5 h-5" />, color: 'yellow' as const },
    { label: 'نرخ اشغال', value: '۷۸٪', subValue: 'این ماه', icon: <TrendingUp className="w-5 h-5" />, color: 'red' as const },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="آمار بازی"
        subtitle={`شناسه: ${id}`}
        breadcrumb={[{ label: 'بازی‌ها', href: '/games' }, { label: 'ویرایش', href: `/games/${id}` }, { label: 'آمار' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card">
          <h3 className="section-title">تعداد رزروها (ماهانه)</h3>
          <Bar data={bookingData} options={chartOptions} />
        </div>

        <div className="admin-card">
          <h3 className="section-title">درآمد (ماهانه)</h3>
          <Line data={revenueData} options={chartOptions} />
        </div>
      </div>

      {/* Top Players Table */}
      <div className="admin-card mt-6">
        <h3 className="section-title">برترین بازیکنان این بازی</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>رتبه</th>
              <th>بازیکن</th>
              <th>تعداد بازی</th>
              <th>آخرین بازی</th>
              <th>امتیاز داده شده</th>
            </tr>
          </thead>
          <tbody>
            {Array(5).fill(0).map((_, i) => (
              <tr key={i}>
                <td className="text-yellow-400 font-bold">#{i + 1}</td>
                <td className="text-white">{['علی احمدی', 'سارا محمدی', 'رضا کریمی', 'نیلوفر', 'امیر'][i]}</td>
                <td className="text-slate-300">{persianNum((10 - i) * 3)} بار</td>
                <td className="text-slate-400 text-sm">۱۴۰۳/۰۳/۱۲</td>
                <td>
                  <div className="flex items-center gap-1">
                    {Array(5).fill(0).map((_, j) => (
                      <Star key={j} className={`w-3.5 h-3.5 ${j < (5 - i) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
