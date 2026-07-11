'use client';
import { motion } from 'framer-motion';

interface Stat {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}

interface StatsGridProps {
  totalXp: number;
  survivedRooms: number;
  badgesCount: number;
  bookingsCount?: number;
}

export default function StatsGrid({
  totalXp,
  survivedRooms,
  badgesCount,
  bookingsCount = 0,
}: StatsGridProps) {
  const stats: Stat[] = [
    {
      label: 'کل تجربه',
      value: totalXp.toLocaleString('fa-IR'),
      icon: 'fa-bolt',
      color: '#00f5ff',
    },
    {
      label: 'اتاق‌های نجات‌یافته',
      value: survivedRooms.toLocaleString('fa-IR'),
      icon: 'fa-skull-crossbones',
      color: '#b026ff',
    },
    {
      label: 'نشان‌های کسب‌شده',
      value: badgesCount.toLocaleString('fa-IR'),
      icon: 'fa-medal',
      color: '#ffd700',
    },
    {
      label: 'کل رزروها',
      value: bookingsCount.toLocaleString('fa-IR'),
      icon: 'fa-calendar-check',
      color: '#2ee6a0',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="dark-card rounded-[18px] p-4 text-center"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: stat.color + '20', color: stat.color }}
          >
            <i className={`fas ${stat.icon} text-lg`} />
          </div>
          <div
            className="text-2xl font-cinzel font-bold mb-1"
            style={{ color: stat.color }}
          >
            {stat.value}
          </div>
          <div className="text-xs text-gray-500 font-vazir">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
