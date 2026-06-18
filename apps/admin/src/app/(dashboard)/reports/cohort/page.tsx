'use client';
import { SectionHeader } from '@/components/ui';

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'];
const COHORT_DATA = [
  [100, 72, 58, 48, 41, 35],
  [100, 68, 54, 45, 38, null],
  [100, 75, 61, 52, null, null],
  [100, 70, 57, null, null, null],
  [100, 65, null, null, null, null],
  [100, null, null, null, null, null],
];

function getColor(val: number | null): string {
  if (val === null) return 'bg-transparent text-transparent';
  if (val >= 80) return 'bg-green-500/80 text-white';
  if (val >= 60) return 'bg-green-500/50 text-green-100';
  if (val >= 40) return 'bg-yellow-500/50 text-yellow-100';
  if (val >= 20) return 'bg-orange-500/40 text-orange-100';
  return 'bg-red-500/30 text-red-200';
}

export default function CohortPage() {
  return (
    <div className="fade-in">
      <SectionHeader
        title="تحلیل Cohort"
        subtitle="نرخ بازگشت کاربران به تفکیک ماه ثبت‌نام"
        breadcrumb={[{ label: 'گزارش‌ها' }, { label: 'Cohort' }]}
      />

      <div className="admin-card">
        <p className="text-slate-400 text-sm mb-6">
          هر ردیف نشان‌دهنده کاربرانی است که در یک ماه مشخص ثبت‌نام کرده‌اند. 
          اعداد درصد کاربرانی هستند که در ماه‌های بعد رزرو داشتند.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">ماه ثبت‌نام</th>
                <th className="py-3 px-2 text-slate-400 font-medium text-center">ماه ۰</th>
                {Array.from({ length: MONTHS.length - 1 }).map((_, i) => (
                  <th key={i} className="py-3 px-2 text-slate-400 font-medium text-center">ماه {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((month, rowIdx) => (
                <tr key={month}>
                  <td className="py-2 px-4 text-slate-300 font-medium">{month} ۱۴۰۳</td>
                  {COHORT_DATA[rowIdx].map((val, colIdx) => (
                    <td key={colIdx} className="py-2 px-1 text-center">
                      {val !== null ? (
                        <div className={`inline-flex items-center justify-center w-16 h-10 rounded-lg text-xs font-bold ${getColor(val)}`}>
                          {val}٪
                        </div>
                      ) : (
                        <div className="w-16 h-10 rounded-lg bg-slate-800/30" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-700">
          <span className="text-slate-500 text-sm">راهنما:</span>
          {[
            { label: '۸۰٪+', color: 'bg-green-500/80' },
            { label: '۶۰-۸۰٪', color: 'bg-green-500/50' },
            { label: '۴۰-۶۰٪', color: 'bg-yellow-500/50' },
            { label: '۲۰-۴۰٪', color: 'bg-orange-500/40' },
            { label: '<۲۰٪', color: 'bg-red-500/30' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded ${item.color}`} />
              <span className="text-slate-400 text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
