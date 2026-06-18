'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { SectionHeader, Toggle, Modal, ConfirmDialog, EmptyState } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import { badgesApi } from '@/lib/api';
import toast from 'react-hot-toast';

const BADGE_ICONS = ['🏆', '⭐', '🔥', '💎', '🎯', '🥷', '👑', '🌟', '💀', '🎮', '🏴‍☠️', '⚡'];

interface AdminBadge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria?: { rarity?: string; triggerEvent?: string; conditions?: Record<string, any> } | null;
  isActive: boolean;
  _count?: { userBadges: number };
}

// admin-badges returns { success, data } directly
function readData<T = any>(res: any): T {
  return res?.data?.data ?? res?.data ?? null;
}

const emptyForm = { code: '', name: '', description: '', icon: '🏆', color: '#dc2626', conditionsText: '{}', isActive: true };

export default function BadgesPage() {
  const [badges, setBadges] = useState<AdminBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await badgesApi.getAll();
      const data = readData<AdminBadge[]>(res);
      setBadges(Array.isArray(data) ? data : []);
    } catch {
      toast.error('خطا در بارگذاری بج‌ها');
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setShowForm(true); };
  const openEdit = (b: AdminBadge) => {
    setEditId(b.id);
    setForm({
      code: b.code,
      name: b.name,
      description: b.description,
      icon: b.icon || '🏆',
      color: b.color || '#dc2626',
      conditionsText: JSON.stringify(b.criteria?.conditions ?? {}, null, 2),
      isActive: b.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) { toast.error('نام و کد الزامی است'); return; }
    let conditions: Record<string, any> = {};
    try {
      conditions = form.conditionsText.trim() ? JSON.parse(form.conditionsText) : {};
    } catch {
      toast.error('معیار JSON نامعتبر است'); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await badgesApi.update(editId, {
          name: form.name, description: form.description, icon: form.icon, color: form.color,
          isActive: form.isActive, conditions,
        } as any);
        toast.success('بج بروزرسانی شد');
      } else {
        await badgesApi.create({
          code: form.code, name: form.name, description: form.description, icon: form.icon,
          color: form.color, isActive: form.isActive, conditions,
        } as any);
        toast.success('بج اضافه شد');
      }
      setShowForm(false);
      setEditId(null);
      load();
    } catch {
      toast.error('خطا در ذخیره بج');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (b: AdminBadge) => {
    setBadges(prev => prev.map(x => x.id === b.id ? { ...x, isActive: !x.isActive } : x));
    try {
      await badgesApi.update(b.id, { isActive: !b.isActive } as any);
    } catch {
      toast.error('خطا در تغییر وضعیت');
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await badgesApi.delete(deleteId);
      setBadges(prev => prev.filter(b => b.id !== deleteId));
      toast.success('بج حذف شد');
    } catch {
      toast.error('خطا در حذف بج');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت بج‌ها"
        subtitle="ایجاد و مدیریت نشان‌های دستاورد"
        breadcrumb={[{ label: 'گیمیفیکیشن' }, { label: 'بج‌ها' }]}
        actions={
          <div className="flex gap-2">
            <button onClick={load} className="btn-secondary" title="بارگذاری مجدد">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" /> بج جدید
            </button>
          </div>
        }
      />

      <div className="admin-card">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> در حال بارگذاری...
          </div>
        ) : badges.length === 0 ? (
          <EmptyState title="بجی ثبت نشده" description="اولین بج دستاورد را ایجاد کنید." />
        ) : (
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
                    <td><span className="text-2xl">{badge.icon}</span></td>
                    <td><span className="text-white font-medium" style={{ color: badge.color }}>{badge.name}</span></td>
                    <td><span className="text-slate-400 font-mono text-xs">{badge.code}</span></td>
                    <td><span className="text-slate-400 text-sm">{badge.description}</span></td>
                    <td>
                      <code className="text-slate-500 text-xs bg-slate-700/50 px-2 py-0.5 rounded">
                        {JSON.stringify(badge.criteria?.conditions ?? {})}
                      </code>
                    </td>
                    <td><span className="text-white font-bold">{persianNum(badge._count?.userBadges ?? 0)}</span></td>
                    <td><Toggle checked={badge.isActive} onChange={() => handleToggle(badge)} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(badge)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
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
        )}
      </div>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'ویرایش بج' : 'بج جدید'}
        size="md"
        footer={
          <>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary">انصراف</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
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
                  onClick={() => setForm(p => ({ ...p, icon }))}
                  className={`text-2xl p-2 rounded-lg transition-all ${form.icon === icon ? 'bg-red-500/20 ring-1 ring-red-500' : 'hover:bg-slate-600'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">نام *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="اولین شکار" />
            </div>
            <div>
              <label className="label-field">کد *</label>
              <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="input-field" placeholder="FIRST_BLOOD" dir="ltr" disabled={!!editId} />
            </div>
          </div>
          <div>
            <label className="label-field">توضیحات</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="label-field">رنگ</label>
            <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-full h-10 rounded-lg cursor-pointer bg-transparent border border-slate-600" />
          </div>
          <div>
            <label className="label-field">معیار اهدا (JSON)</label>
            <textarea
              value={form.conditionsText}
              onChange={e => setForm(p => ({ ...p, conditionsText: e.target.value }))}
              className="input-field resize-none h-24 font-mono text-sm"
              dir="ltr"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            فعال باشد
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف بج"
        description="آیا از حذف این بج اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
