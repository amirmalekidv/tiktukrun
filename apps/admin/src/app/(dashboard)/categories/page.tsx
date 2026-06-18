'use client';
import { useState } from 'react';
import { Plus, Edit, Trash2, Check } from 'lucide-react';
import { SectionHeader, Toggle, ConfirmDialog } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = ['🎮', '🔫', '🥽', '🎯', '♟️', '🎪', '🏴‍☠️', '🧩'];

const MOCK_CATEGORIES = [
  { id: 'c1', name: 'اتاق فرار', slug: 'escape-room', icon: '🎮', isActive: true, gamesCount: 5 },
  { id: 'c2', name: 'لیزرتگ', slug: 'lasertag', icon: '🔫', isActive: true, gamesCount: 3 },
  { id: 'c3', name: 'VR', slug: 'vr', icon: '🥽', isActive: true, gamesCount: 4 },
  { id: 'c4', name: 'پینت‌بال', slug: 'paintball', icon: '🎯', isActive: true, gamesCount: 2 },
  { id: 'c5', name: 'بردگیم', slug: 'boardgame', icon: '♟️', isActive: false, gamesCount: 6 },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🎮');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت دسته‌بندی‌ها"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'دسته‌بندی‌ها' }]}
      />

      <div className="max-w-3xl space-y-6">
        {/* Add New */}
        <div className="admin-card">
          <h3 className="section-title">دسته‌بندی جدید</h3>
          <div className="flex gap-3">
            <div className="flex gap-1">
              {CATEGORY_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewIcon(icon)}
                  className={`text-2xl p-2 rounded-lg transition-all ${newIcon === icon ? 'bg-red-500/20 ring-1 ring-red-500' : 'hover:bg-slate-700'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="input-field flex-1"
              placeholder="نام دسته‌بندی..."
            />
            <button
              onClick={() => {
                if (!newName) return;
                setCategories(prev => [...prev, { id: Date.now().toString(), name: newName, slug: newName, icon: newIcon, isActive: true, gamesCount: 0 }]);
                setNewName('');
                toast.success('دسته‌بندی اضافه شد');
              }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> افزودن
            </button>
          </div>
        </div>

        {/* List */}
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>آیکون</th>
                <th>نام</th>
                <th>تعداد بازی</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td className="text-2xl">{cat.icon}</td>
                  <td>
                    {editId === cat.id ? (
                      <div className="flex gap-2">
                        <input defaultValue={cat.name} className="input-field py-1 flex-1" />
                        <button onClick={() => setEditId(null)} className="btn-primary py-1 px-2">
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-white font-medium">{cat.name}</span>
                    )}
                  </td>
                  <td>{persianNum(cat.gamesCount)} بازی</td>
                  <td>
                    <Toggle
                      checked={cat.isActive}
                      onChange={() => setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c))}
                    />
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setEditId(cat.id)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(cat.id)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400">
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

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { setCategories(p => p.filter(c => c.id !== deleteId)); toast.success('حذف شد'); setDeleteId(null); }}
        title="حذف دسته‌بندی"
        description="آیا از حذف اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
