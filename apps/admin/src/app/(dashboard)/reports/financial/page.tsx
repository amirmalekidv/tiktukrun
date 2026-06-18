'use client';
import { useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Download, TrendingUp, TrendingDown, ArrowRightLeft, Percent } from 'lucide-react';
import { SectionHeader, StatsCard } from '@/components/ui';
import { formatToman, formatTomanShort } from '@/lib/utils/format';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

const chartOpts = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: '#94a3b8', font: { family: 'Vazirmatn' } } },
    tooltip: { backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(71,85,105,0.15)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(71,85,105,0.15)' } },
  },
};

const cashflowData = {
  labels: months,
  datasets: [
    {
      label: 'درآمد',
      data: [12, 19, 15, 25, 22, 30, 28, 35, 31, 40, 38, 45].map(v => v * 1000000),
      backgroundColor: 'rgba(34,197,94,0.7)',
      borderColor: '#22c55e',
    },
    {
      label: 'هزینه',
      data: [5, 7, 6, 10, 9, 11, 10, 13, 12, 14, 13, 16].map(v => v * 1000000),
      backgroundColor: 'rgba(239,68,68,0.7)',
      borderColor: '#ef4444',
    },
    {
      label: 'سود',
      data: [7, 12, 9, 15, 13, 19, 18, 22, 19, 26, 25, 29].map(v => v * 1000000),
      backgroundColor: 'rgba(234,179,8,0.7)',
      borderColor: '#eab308',
    },
  ],
};

const paymentMethodsData = {
  labels: ['کیف پول', 'زرین‌پال', 'نقد'],
  datasets: [{
    data: [45, 40, 15],
    backgroundColor: ['rgba(220,38,38,0.8)', 'rgba(59,130,246,0.8)', 'rgba(34,197,94,0.8)'],
    borderColor: ['#dc2626', '#3b82f6', '#22c55e'],
    borderWidth: 2,
  }],
};

const branchRevenueData = {
  labels: ['تهران', 'مشهد', 'اصفهان'],
  datasets: [{
    label: 'درآمد (میلیون تومان)',
    data: [280, 150, 90],
    backgroundColor: ['rgba(220,38,38,0.7)', 'rgba(59,130,246,0.7)', 'rgba(34,197,94,0.7)'],
    borderRadius: 8,
  }],
};

type DateRange = 'month' | 'quarter' | 'year' | 'custom';

export default function FinancialReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');

  const pnl = {
    totalRevenue: 340000000,
    refunds: 8500000,
    netRevenue: 331500000,
    commission: 33150000,
    gatewayFees: 6630000,
    netProfit: 291720000,
  };

  const stats = [
    { label: 'درآمد کل', value: formatToman(pnl.totalRevenue), color: 'green' as const, icon: <TrendingUp className="w-5 h-5" />, trend: 12 },
    { label: 'سود خالص', value: formatToman(pnl.netProfit), color: 'blue' as const, icon: <ArrowRightLeft className="w-5 h-5" />, trend: 8 },
    { label: 'بازگشت وجه', value: formatToman(pnl.refunds), color: 'red' as const, icon: <TrendingDown className="w-5 h-5" /> },
    { label: 'کمیسیون', value: formatToman(pnl.commission), color: 'yellow' as const, icon: <Percent className="w-5 h-5" /> },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="گزارش مالی"
        subtitle="تحلیل جامع درآمد، هزینه و سود"
        breadcrumb={[{ label: 'گزارش‌ها' }, { label: 'مالی' }]}
        actions={
          <div className="flex gap-2">
            <button onClick={() => toast.success('در حال دانلود PDF...')} className="btn-secondary">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={() => toast.success('در حال دانلود Excel...')} className="btn-secondary">
              <Download className="w-4 h-4" /> Excel
            </button>
          </div>
        }
      />

      {/* Date Range Selector */}
      <div className="flex gap-2 mb-6">
        {([['month', 'این ماه'], ['quarter', 'این سه‌ماه'], ['year', 'این سال'], ['custom', 'سفارشی']] as [DateRange, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setDateRange(val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === val ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      {/* P&L Box */}
      <div className="admin-card mb-6">
        <h3 className="section-title">صورت سود و زیان (P&L)</h3>
        <div className="space-y-2">
          {[
            { label: 'کل درآمد', value: pnl.totalRevenue, color: 'text-green-400' },
            { label: 'بازگشت وجه', value: -pnl.refunds, color: 'text-red-400' },
            { label: 'درآمد خالص', value: pnl.netRevenue, color: 'text-white', border: true },
            { label: 'کمیسیون (۱۰٪)', value: -pnl.commission, color: 'text-red-400' },
            { label: 'کارمزد درگاه (۲٪)', value: -pnl.gatewayFees, color: 'text-red-400' },
            { label: 'سود خالص نهایی', value: pnl.netProfit, color: 'text-yellow-400', border: true, bold: true },
          ].map((item, i) => (
            <div key={i} className={`flex justify-between items-center py-2 ${item.border ? 'border-t-2 border-slate-700 mt-2' : ''}`}>
              <span className="text-slate-400 text-sm">{item.label}</span>
              <span className={`font-mono ${item.color} ${item.bold ? 'font-black text-lg' : 'font-bold'}`}>
                {item.value >= 0 ? '' : '-'}{formatToman(Math.abs(item.value))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="admin-card">
          <h3 className="section-title">جریان نقدی ماهانه</h3>
          <Bar data={cashflowData} options={chartOpts} />
        </div>
        <div className="admin-card">
          <h3 className="section-title">توزیع روش‌های پرداخت</h3>
          <Pie data={paymentMethodsData} options={{ ...chartOpts, scales: undefined }} />
        </div>
      </div>

      <div className="admin-card">
        <h3 className="section-title">درآمد به تفکیک شعبه</h3>
        <Bar data={branchRevenueData} options={chartOpts} />
      </div>
    </div>
  );
}
