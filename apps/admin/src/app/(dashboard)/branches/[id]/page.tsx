'use client';

import { useState } from 'react';
import { SectionHeader, StatusBadge } from '@/components/ui';
import { FiMapPin, FiEdit2, FiSave, FiArrowRight, FiPhone, FiClock, FiUsers, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import Link from 'next/link';

interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  managerName: string;
  capacity: number;
  gamesCount: number;
  status: 'active' | 'inactive' | 'maintenance';
  workingHours: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  monthlyBookings: number;
  monthlyRevenue: number;
  avgRating: number;
}

const MOCK_BRANCH: Branch = {
  id: '1',
  name: 'شعبه تهران',
  city: 'تهران',
  address: 'تهران، خیابان ولیعصر، پلاک ۴۵۲',
  phone: '021-88001122',
  managerName: 'علی محمدی',
  capacity: 50,
  gamesCount: 8,
  status: 'active',
  workingHours: '۹ صبح تا ۱۲ شب - هر روز',
  lat: 35.715,
  lng: 51.404,
  createdAt: '۱۴۰۱/۰۳/۰۱',
  monthlyBookings: 342,
  monthlyRevenue: 85500000,
  avgRating: 4.6,
};

const WEEKLY_STATS = [
  { day: 'شنبه', bookings: 48, revenue: 12000000 },
  { day: 'یکشنبه', bookings: 52, revenue: 13000000 },
  { day: 'دوشنبه', bookings: 35, revenue: 8750000 },
  { day: 'سه‌شنبه', bookings: 41, revenue: 10250000 },
  { day: 'چهارشنبه', bookings: 38, revenue: 9500000 },
  { day: 'پنجشنبه', bookings: 65, revenue: 16250000 },
  { day: 'جمعه', bookings: 78, revenue: 19500000 },
];

const BRANCH_GAMES = [
  { id: 'g1', name: 'عملیات فرار', category: 'ترسناک', duration: 60, price: 250000, bookingsMonth: 89, status: 'active' },
  { id: 'g2', name: 'گنج دزد دریایی', category: 'ماجراجویی', duration: 75, price: 300000, bookingsMonth: 76, status: 'active' },
  { id: 'g3', name: 'آزمایشگاه مخفی', category: 'علمی', duration: 60, price: 280000, bookingsMonth: 54, status: 'active' },
  { id: 'g4', name: 'قلعه اشباح', category: 'ترسناک', duration: 90, price: 350000, bookingsMonth: 123, status: 'active' },
];

export default function BranchDetailPage({ params }: { params: { id: string } }) {
  const [branch, setBranch] = useState<Branch>(MOCK_BRANCH);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...MOCK_BRANCH });

  const save = () => {
    setBranch({ ...form });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/branches" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <FiArrowRight className="w-5 h-5" />
        </Link>
        <SectionHeader
          title={branch.name}
          subtitle={`${branch.city} · ${branch.gamesCount} بازی`}
          icon={<FiMapPin />}
          action={
            editing ? (
              <button onClick={save} className="btn-primary flex items-center gap-2 px-4 py-2">
                <FiSave className="w-4 h-4" />
                ذخیره
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
                <FiEdit2 className="w-4 h-4" />
                ویرایش
              </button>
            )
          }
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <FiCalendar className="w-4 h-4 text-blue-400" />
            <p className="text-slate-400 text-sm">رزروهای این ماه</p>
          </div>
          <p className="text-2xl font-bold text-white">{branch.monthlyBookings.toLocaleString('fa-IR')}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <FiTrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-slate-400 text-sm">درآمد این ماه</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{(branch.monthlyRevenue / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <FiUsers className="w-4 h-4 text-purple-400" />
            <p className="text-slate-400 text-sm">ظرفیت</p>
          </div>
          <p className="text-2xl font-bold text-white">{branch.capacity}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-400 text-sm">⭐</span>
            <p className="text-slate-400 text-sm">میانگین امتیاز</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">{branch.avgRating}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Info */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">اطلاعات شعبه</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">نام شعبه</label>
              {editing ? (
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field w-full" />
              ) : (
                <p className="text-white">{branch.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">آدرس</label>
              {editing ? (
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input-field w-full resize-none" rows={2} />
              ) : (
                <div className="flex items-start gap-2">
                  <FiMapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="text-white text-sm">{branch.address}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">تلفن</label>
              {editing ? (
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input-field w-full" />
              ) : (
                <div className="flex items-center gap-2">
                  <FiPhone className="w-4 h-4 text-slate-500" />
                  <p className="text-white">{branch.phone}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">ساعات کاری</label>
              {editing ? (
                <input value={form.workingHours} onChange={e => setForm(p => ({ ...p, workingHours: e.target.value }))} className="input-field w-full" />
              ) : (
                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-slate-500" />
                  <p className="text-white text-sm">{branch.workingHours}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">مدیر شعبه</label>
              {editing ? (
                <input value={form.managerName} onChange={e => setForm(p => ({ ...p, managerName: e.target.value }))} className="input-field w-full" />
              ) : (
                <p className="text-white">{branch.managerName}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs text-slate-400 mb-1">وضعیت</label>
                <StatusBadge
                  status={branch.status === 'active' ? 'success' : branch.status === 'maintenance' ? 'warning' : 'default'}
                  label={branch.status === 'active' ? 'فعال' : branch.status === 'maintenance' ? 'تعمیرات' : 'غیرفعال'}
                />
              </div>
              <div className="text-left">
                <label className="block text-xs text-slate-400 mb-1">تاریخ افتتاح</label>
                <p className="text-white text-sm">{branch.createdAt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">آمار هفتگی</h3>
          <div className="space-y-3">
            {WEEKLY_STATS.map(d => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-slate-400 text-sm w-16">{d.day}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(d.bookings / 80) * 100}%` }}
                  />
                </div>
                <span className="text-slate-300 text-sm w-8">{d.bookings}</span>
                <span className="text-green-400 text-xs w-20 text-left">{(d.revenue / 1000000).toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Games in Branch */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">بازی‌های این شعبه ({BRANCH_GAMES.length})</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-right text-slate-400 text-sm font-medium p-4">بازی</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">دسته‌بندی</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">مدت</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">قیمت</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">رزرو این ماه</th>
              <th className="text-right text-slate-400 text-sm font-medium p-4">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {BRANCH_GAMES.map(g => (
              <tr key={g.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                <td className="p-4">
                  <Link href={`/games/${g.id}`} className="text-white hover:text-red-400 font-medium text-sm transition-colors">{g.name}</Link>
                </td>
                <td className="p-4">
                  <span className="text-slate-300 text-sm">{g.category}</span>
                </td>
                <td className="p-4">
                  <span className="text-slate-300 text-sm">{g.duration} دقیقه</span>
                </td>
                <td className="p-4">
                  <span className="text-green-400 text-sm">{g.price.toLocaleString('fa-IR')} ت</span>
                </td>
                <td className="p-4">
                  <span className="text-white font-medium">{g.bookingsMonth}</span>
                </td>
                <td className="p-4">
                  <StatusBadge status="success" label="فعال" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
