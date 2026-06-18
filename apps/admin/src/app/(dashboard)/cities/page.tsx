'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, Check, RefreshCw } from 'lucide-react';
import { SectionHeader, ConfirmDialog, Toggle, EmptyState } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import { citiesApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface AdminCity {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder?: number;
  branches?: unknown[];
}

function unwrap<T = any>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

// تبدیل نام فارسی به slug لاتین یکتا (بک‌اند فقط a-z0-9- می‌پذیرد)
function slugify(name: string): string {
  const s = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return s || `city-${Date.now()}`;
}

export default function CitiesPage() {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await citiesApi.getAll();
      const payload = unwrap<AdminCity[] | { data: AdminCity[] }>(res);
      setCities(Array.isArray(payload) ? payload : (payload as any)?.data ?? []);
    } catch {
      toast.error('خطا در بارگذاری شهرها');
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await citiesApi.create({ name: newName.trim(), slug: slugify(newName), isActive: true } as any);
      setNewName('');
      toast.success('شهر اضافه شد');
      load();
    } catch {
      toast.error('خطا در افزودن شهر');
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await citiesApi.update(id, { name: editName.trim() } as any);
      setCities(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
      setEditId(null);
      toast.success('شهر ویرایش شد');
    } catch {
      toast.error('خطا در ویرایش شهر');
    }
  };

  const handleToggle = async (city: AdminCity) => {
    setCities(prev => prev.map(c => c.id === city.id ? { ...c, isActive: !c.isActive } : c));
    try {
      await citiesApi.update(city.id, { isActive: !city.isActive } as any);
    } catch {
      toast.error('خطا');
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await citiesApi.delete(deleteId);
      setCities(prev => prev.filter(c => c.id !== deleteId));
      toast.success('شهر حذف شد');
    } catch {
      toast.error('خطا در حذف شهر');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت شهرها"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'شهرها' }]}
        actions={
          <button onClick={load} className="btn-secondary" title="بارگذاری مجدد">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="max-w-2xl space-y-6">
        {/* Add New City */}
        <div className="admin-card">
          <h3 className="section-title">افزودن شهر جدید</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="input-field flex-1"
              placeholder="نام شهر..."
            />
            <button onClick={handleAdd} className="btn-primary">
              <Plus className="w-4 h-4" />
              افزودن
            </button>
          </div>
        </div>

        {/* Cities List */}
        <div className="admin-card">
          <h3 className="section-title">لیست شهرها ({persianNum(cities.length)})</h3>
          {loading ? (
            <div className="text-center py-10 text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> در حال بارگذاری...
            </div>
          ) : cities.length === 0 ? (
            <EmptyState title="شهری ثبت نشده" description="اولین شهر را اضافه کنید." />
          ) : (
            <div className="space-y-2">
              {cities.map(city => (
                <div key={city.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                  <Toggle checked={city.isActive} onChange={() => handleToggle(city)} />
                  <div className="flex-1">
                    {editId === city.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="input-field flex-1 py-1"
                          autoFocus
                        />
                        <button onClick={() => handleEdit(city.id)} className="btn-primary py-1 px-3">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <span className="text-white font-medium">{city.name}</span>
                        <span className="text-slate-500 text-xs mr-3">{persianNum(city.branches?.length ?? 0)} شعبه</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditId(city.id); setEditName(city.name); }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(city.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف شهر"
        description="آیا از حذف این شهر اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
