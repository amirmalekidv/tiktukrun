'use client';
import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { SectionHeader, Toggle, Modal, ConfirmDialog } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const BADGE_ICONS = ['🏆', '⭐', '🔥', '💎', '🎯', '🥷', '👑', '🌟', '💀', '🎮', '🏴‍☠️', '⚡'];

const MOCK_BADGES = [
  { id: 'b1', code: 'FIRST_BLOOD', name: 'اولین شکار', icon: '🔥', color: '#ef4444', description: 'اولین رزرو را انجام دهید', criteria: { bookings: 1 }, totalAwarded: 523, isActive: true },
  { id: 'b2', code: 'VETERAN', name: 'کهنه‌کار', icon: '🏆', color: '#f59e0b', description: 'بیش از ۱۰ رزرو داشته باشید', criteria: { bookings: 10 }, totalAwarded: 182, isActive: true },
  { id: 'b3', code: 'DIAMOND_PLAYER', name: 'بازیکن الماسی', icon: '💎', color: '#3b82f6', description: 'به تیر الماس برسید', criteria: { tier: 'DIAMOND' }, totalAwarded: 45, isActive: true },
  { id: 'b4', code: 'SOCIAL_KING', name: 'پادشاه اجتماعی', icon: '👑', color: '#a855f7', description: 'بیش از ۵ نفر دعوت کنید', criteria: { invites: 5 }, totalAwarded: 89, isActive: false },
];

export default function BadgesPage() {
  const [badges, setBadges] = useState(MOCK_BADGES);
  const [showForm, setShowForm] = useState(false);
  const [editBadge, setEditBadge] = useState<typeof MOCK_BADGES[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState('🏆');

  const handleSubmit = () => {
    toast.success(editBadge ? 'بج بروزرسانی شد' : 'بج اضافه شد');
    setShowForm(false);
    setEditBadge(null);
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت بج‌ها"
        subtitle="ایجاد و مدیریت نشان‌های دستاورد"
        breadcrumb={[{ label: 'گیمیفیکیشن' }, { label: 'بج‌ها' }]}
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> بج جدید
          </button>
        }
      />

      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>آیکون</th>
                <th>نام</th>
                <th>کد</th>
                <th>توضیحات</th>
                <th>معیار</th>
                <th>اهدا شده</th>
                <th>فعال</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {badges.map(badge => (
                <tr key={badge.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{badge.icon}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-white font-medium" style={{ color: badge.color }}>{badge.name}</span>
                  </td>
                  <td>
                    <span className="text-slate-400 font-mono text-xs">{badge.code}</span>
                  </td>
                  <td>
                    <span className="text-slate-400 text-sm">{badge.description}</span>
                  </td>
                  <td>
                    <code className="text-slate-500 text-xs bg-slate-700/50 px-2 py-0.5 rounded">
                      {JSON.stringify(badge.criteria)}
                    </code>
                  </td>
                  <td>
                    <span className="text-white font-bold">{persianNum(badge.totalAwarded)}</span>
                  </td>
                  <td>
                    <Toggle
                      checked={badge.isActive}
                      onChange={() => setBadges(prev => prev.map(b => b.id === badge.id ? { ...b, isActive: !b.isActive } : b))}
                    />
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditBadge(badge); setSelectedIcon(badge.icon); setShowForm(true); }} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(badge.id)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditBadge(null); }}
        title={editBadge ? 'ویرایش بج' : 'بج جدید'}
        size="md"
        footer={
          <>
            <button onClick={() => { setShowForm(false); setEditBadge(null); }} className="btn-secondary">انصراف</button>
            <button onClick={handleSubmit} className="btn-primary">ذخیره</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">آیکون بج</label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-700/30 rounded-xl">
              {BADGE_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`text-2xl p-2 rounded-lg transition-all ${selectedIcon === icon ? 'bg-red-500/20 ring-1 ring-red-500' : 'hover:bg-slate-600'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">نام *</label>
              <input defaultValue={editBadge?.name} className="input-field" placeholder="اولین شکار" />
            </div>
            <div>
              <label className="label-field">کد *</label>
              <input defaultValue={editBadge?.code} className="input-field" placeholder="FIRST_BLOOD" dir="ltr" />
            </div>
          </div>
          <div>
            <label className="label-field">توضیحات</label>
            <input defaultValue={editBadge?.description} className="input-field" />
          </div>
          <div>
            <label className="label-field">رنگ</label>
            <input type="color" defaultValue={editBadge?.color || '#dc2626'} className="w-full h-10 rounded-lg cursor-pointer bg-transparent border border-slate-600" />
          </div>
          <div>
            <label className="label-field">معیار اهدا (JSON)</label>
            <textarea
              defaultValue={JSON.stringify(editBadge?.criteria || {}, null, 2)}
              className="input-field resize-none h-24 font-mono text-sm"
              dir="ltr"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { setBadges(p => p.filter(b => b.id !== deleteId)); toast.success('حذف شد'); setDeleteId(null); }}
        title="حذف بج"
        description="آیا از حذف این بج اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
