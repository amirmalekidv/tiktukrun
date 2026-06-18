'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Check, X, RefreshCw } from 'lucide-react';
import { SectionHeader, Toggle, ConfirmDialog, EmptyState } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import { categoriesApi } from '@/lib/api';
import type { Category } from '@/lib/types';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = ['🎮', '🔫', '🥽', '🎯', '♟️', '🎪', '🏴‍☠️', '🧩', '🕵️', '🎲', '🎬'];

// خواندن داده از پاسخ بک‌اند (ResponseInterceptor → { success, data })
function unwrap<T = any>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

// ساخت slug انگلیسی/لاتین ساده از نام
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '')
    || `cat-${Date.now()}`;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newIcon, setNewIcon] = useState('🎮');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.getAll();
      setCategories(unwrap<Category[]>(res) ?? []);
    } catch {
      toast.error('خطا در بارگذاری دسته‌بندی‌ها');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await categoriesApi.create({
        name: newName.trim(),
        slug: (newSlug.trim() || slugify(newName)),
        icon: newIcon,
        isActive: true,
      } as Partial<Category>);
      toast.success('دسته‌بندی اضافه شد');
      setNewName(''); setNewSlug('');
      load();
    } catch {
      toast.error('خطا در افزودن دسته‌بندی');
    }
  };

  const handleSaveEdit = async (cat: Category) => {
    try {
      await categoriesApi.update(cat.id, { name: editName.trim() || cat.name } as Partial<Category>);
      toast.success('بروزرسانی شد');
      setEditId(null);
      load();
    } catch {
      toast.error('خطا در بروزرسانی');
    }
  };

  const handleToggle = async (cat: Category) => {
    try {
      await categoriesApi.update(cat.id, { isActive: !cat.isActive } as Partial<Category>);
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
    } catch {
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await categoriesApi.delete(deleteId);
      toast.success('حذف شد');
      setDeleteId(null);
      load();
    } catch {
      toast.error('خطا در حذف');
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت دسته‌بندی‌ها"
        subtitle="افزودن، ویرایش و مدیریت دسته‌بندی بازی‌ها (سینما ترس، بردگیم، مافیا، لیزرتگ و ...)"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'دسته‌بندی‌ها' }]}
        actions={
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">
            <RefreshCw className="w-4 h-4" /> بروزرسانی
          </button>
        }
      />

      <div className="max-w-3xl space-y-6">
        {/* Add New */}
        <div className="admin-card">
          <h3 className="section-title">دسته‌بندی جدید</h3>
          <div className="flex gap-1 flex-wrap mb-3">
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
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="input-field flex-1 min-w-[180px]"
              placeholder="نام دسته‌بندی (مثلاً: مافیا)"
            />
            <input
              type="text"
              value={newSlug}
              onChange={e => setNewSlug(e.target.value)}
              className="input-field flex-1 min-w-[140px]"
              placeholder="slug (اختیاری، مثلاً: mafia)"
              dir="ltr"
            />
            <button onClick={handleAdd} className="btn-primary">
              <Plus className="w-4 h-4" /> افزودن
            </button>
          </div>
        </div>

        {/* List */}
        <div className="admin-card">
          {loading ? (
            <div className="text-center py-10 text-slate-400">در حال بارگذاری...</div>
          ) : categories.length === 0 ? (
            <EmptyState title="دسته‌بندی‌ای یافت نشد" description="یک دسته‌بندی جدید اضافه کنید." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>آیکون</th>
                  <th>نام</th>
                  <th>slug</th>
                  <th>تعداد بازی</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td className="text-2xl">{cat.icon || '🎮'}</td>
                    <td>
                      {editId === cat.id ? (
                        <div className="flex gap-2">
                          <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="input-field py-1 flex-1"
                          />
                          <button onClick={() => handleSaveEdit(cat)} className="btn-primary py-1 px-2">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => setEditId(null)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-white font-medium">{cat.name}</span>
                      )}
                    </td>
                    <td className="text-slate-400 text-sm" dir="ltr">{cat.slug}</td>
                    <td>{persianNum(cat.gamesCount ?? 0)} بازی</td>
                    <td>
                      <Toggle checked={cat.isActive} onChange={() => handleToggle(cat)} />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                          className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف دسته‌بندی"
        message="آیا از حذف این دسته‌بندی اطمینان دارید؟"
        confirmText="حذف"
        variant="danger"
      />
    </div>
  );
}
