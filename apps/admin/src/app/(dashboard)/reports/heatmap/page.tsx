'use client';
import { SectionHeader } from '@/components/ui';

const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

// Generate mock heatmap data [day][hour] = activity count
const HEATMAP_DATA = Array(7).fill(0).map((_, day) =>
  Array(24).fill(0).map((_, hour) => {
    const base = hour >= 14 && hour <= 22 ? 80 : hour >= 10 && hour <= 13 ? 40 : 5;
    const dayBonus = day >= 4 ? 1.5 : 1;
    return Math.floor(base * dayBonus * (0.7 + Math.random() * 0.6));
  })
);

const MAX_VAL = Math.max(...HEATMAP_DATA.flat());

function getHeatColor(val: number): string {
  const ratio = val / MAX_VAL;
  if (ratio > 0.8) return 'bg-red-500';
  if (ratio > 0.6) return 'bg-red-500/70';
  if (ratio > 0.4) return 'bg-orange-500/60';
  if (ratio > 0.2) return 'bg-yellow-500/40';
  if (ratio > 0.05) return 'bg-green-500/20';
  return 'bg-slate-700/30';
}

export default function HeatmapPage() {
  return (
    <div className="fade-in">
      <SectionHeader
        title="Heatmap فعالیت"
        subtitle="ساعات و روزهای پر-ترافیک پلتفرم"
        breadcrumb={[{ label: 'گزارش‌ها' }, { label: 'Heatmap' }]}
      />

      <div className="admin-card">
        <p className="text-slate-400 text-sm mb-6">
          هر خانه نشان‌دهنده تعداد رزروهای انجام شده در آن ساعت از هفته است. رنگ‌های تیره‌تر = فعالیت بیشتر.
        </p>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Hour headers */}
            <div className="flex mb-2 gap-0.5 pr-24">
              {HOURS.filter((_, i) => i % 2 === 0).map(h => (
                <div key={h} className="flex-1 text-center text-slate-600 text-xs">{h}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="space-y-1">
              {DAYS.map((day, dayIdx) => (
                <div key={day} className="flex items-center gap-0.5">
                  <div className="w-24 text-slate-400 text-sm text-right ml-2">{day}</div>
                  {HEATMAP_DATA[dayIdx].map((val, hourIdx) => (
                    <div
                      key={hourIdx}
                      className={`flex-1 h-10 rounded-sm ${getHeatColor(val)} transition-all cursor-default group relative`}
                      title={`${day} ساعت ${HOURS[hourIdx]}: ${val} رزرو`}
                    >
                      <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 text-white">
                        {val} رزرو
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-700">
          <span className="text-slate-500 text-sm">کمتر</span>
          <div className="flex gap-1">
            {['bg-slate-700/30', 'bg-green-500/20', 'bg-yellow-500/40', 'bg-orange-500/60', 'bg-red-500/70', 'bg-red-500'].map((c, i) => (
              <div key={i} className={`w-8 h-5 rounded ${c}`} />
            ))}
          </div>
          <span className="text-slate-500 text-sm">بیشتر</span>
        </div>
      </div>
    </div>
  );
}
