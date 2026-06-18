'use client';

import Link from 'next/link';
import { SectionHeader } from '@/components/ui';
import { FiShield, FiArrowRight, FiUsers } from 'react-icons/fi';

export default function RoleDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/roles" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <FiArrowRight className="w-5 h-5" />
        </Link>
        <SectionHeader
          title={`جزئیات نقش #${params.id}`}
          subtitle="مشاهده دسترسی‌ها و کاربران این نقش"
          icon={<FiShield />}
        />
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center">
            <FiShield className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">اپراتور</h2>
            <p className="text-slate-400 text-sm">مدیریت رزروها و تیکت‌ها</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-white font-semibold mb-3">دسترسی‌های فعال</h3>
            <div className="space-y-2">
              {['مشاهده رزروها', 'ویرایش رزرو', 'مشاهده تیکت‌ها', 'پاسخ تیکت', 'بستن تیکت'].map(p => (
                <div key={p} className="flex items-center gap-2 p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-slate-300 text-sm">{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <FiUsers className="text-blue-400 w-4 h-4" />
              کاربران با این نقش (۸)
            </h3>
            <div className="space-y-2">
              {['فاطمه حسینی', 'احمد رضایی', 'سارا محمدی'].map(u => (
                <div key={u} className="flex items-center gap-2 p-2 bg-slate-750 rounded-lg">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {u[0]}
                  </div>
                  <span className="text-slate-300 text-sm">{u}</span>
                </div>
              ))}
              <p className="text-slate-500 text-xs pr-2">+ ۵ نفر دیگر</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href={`/roles`} className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
            ویرایش نقش
          </Link>
        </div>
      </div>
    </div>
  );
}
