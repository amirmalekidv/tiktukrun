'use client';

type Period = 'week' | 'month' | 'all';

interface PeriodToggleProps {
  value: Period;
  onChange: (p: Period) => void;
}

const OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: 'هفتگی' },
  { value: 'month', label: 'ماهانه' },
  { value: 'all', label: 'همه زمان‌ها' },
];

export default function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div className="flex bg-gray-900/60 border border-red-900/20 rounded-xl p-1 gap-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 py-2 px-4 rounded-lg text-sm font-vazir transition-all
            ${value === opt.value
              ? 'bg-red-900/50 text-red-400 border border-red-700/50'
              : 'text-gray-500 hover:text-gray-300'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
