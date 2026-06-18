'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { SectionHeader, Toggle, Modal, ConfirmDialog, EmptyState } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import { wheelApi } from '@/lib/api';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend);

// مطابق enum WheelPrizeType بک‌اند
interface Prize {
  id: string;
  name: string;
  type: string;
  value: number;
  probabilityWeight: number;
  color: string;
  icon: string;
  isActive: boolean;
}

const PRIZE_TYPE_LABELS: Record<string, string> = {
  COINS: 'سکه', DIAMONDS: 'الماس', XP: 'XP', DISCOUNT_CODE: 'کد تخفیف', FREE_TICKET: 'بلیط رایگان', TOMAN: 'تومان',
};
const PRIZE_TYPE_COLORS: Record<string, string> = {
  COINS: 'bg-yellow-500/20 text-yellow-400',
  DIAMONDS: 'bg-blue-500/20 text-blue-400',
  XP: 'bg-purple-500/20 text-purple-400',
  DISCOUNT_CODE: 'bg-green-500/20 text-green-400',
  FREE_TICKET: 'bg-pink-500/20 text-pink-400',
  TOMAN: 'bg-emerald-500/20 text-emerald-400',
};

// admin-wheel returns { success, data } directly
function readData<T = any>(res: any): T {
  return res?.data?.data ?? res?.data ?? null;
}

const emptyForm = { name: '', type: 'COINS', value: 0, weight: 10, color: '#dc2626', icon: '🎁', isActive: true };

export default function WheelPrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wheelApi.getPrizes();
      const data = readData<Prize[]>(res);
      setPrizes(Array.isArray(data) ? data : []);
    } catch {
      toast.error('خطا در بارگذاری جوایز');
      setPrizes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setShowForm(true); };
  const openEdit = (p: Prize) => {
    setEditId(p.id);
    setForm({ name: p.name, type: p.type, value: p.value, weight: p.probabilityWeight, color: p.color, icon: p.icon || '🎁', isActive: p.isActive });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('نام جایزه الزامی است'); return; }
    setSaving(true);
    try {
      if (editId) {
        await wheelApi.updatePrize(editId, { name: form.name, value: form.value, probabilityWeight: form.weight, isActive: form.isActive } as any);
        toast.success('جایزه بروزرسانی شد');
      } else {
        await wheelApi.createPrize({ name: form.name, type: form.type, value: form.value, weight: form.weight, color: form.color, icon: form.icon, isActive: form.isActive } as any);
        toast.success('جایزه اضافه شد');
      }
      setShowForm(false);
      setEditId(null);
      load();
    } catch {
      toast.error('خطا در ذخیره جایزه');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p: Prize) => {
    setPrizes(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x));
    try {
      await wheelApi.togglePrize(p.id);
    } catch {
      toast.error('خطا در تغییر وضعیت');
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await wheelApi.deletePrize(deleteId);
      setPrizes(prev => prev.filter(p => p.id !== deleteId));
      toast.success('جایزه حذف شد');
    } catch {
      toast.error('خطا در حذف جایزه');
    } finally {
      setDeleteId(null);
    }
  };

  const active = prizes.filter(p => p.isActive);
  const totalWeight = active.reduce((sum, p) => sum + p.probabilityWeight, 0);
  const maxWeight = Math.max(1, ...prizes.map(p => p.probabilityWeight));

  const chartData = {
    labels: active.map(p => p.name),
    datasets: [{
      data: active.map(p => p.probabilityWeight),
      backgroundColor: active.map(p => (p.color || '#475569') + 'CC'),
      borderColor: active.map(p => p.color || '#475569'),
      borderWidth: 2,
    }],
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت جوایز گردونه"
        subtitle="تنظیم جوایز و احتمال‌های گردونه شانس"
        breadcrumb={[{ label: 'گردونه شانس' }, { label: 'جوایز' }]}
        actions={
          <div className="flex gap-2">
            <button onClick={load} className="btn-secondary" title="بارگذاری مجدد">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" /> جایزه جدید
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> در حال بارگذاری...
        </div>
      ) : prizes.length === 0 ? (
        <EmptyState title="جایزه‌ای ثبت نشده" description="اولین جایزه گردونه را اضافه کنید." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="admin-card">
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>نام جایزه</th>
                      <th>نوع</th>
                      <th>ارزش</th>
                      <th>وزن احتمال</th>
                      <th>احتمال</th>
                      <th>فعال</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prizes.map(prize => (
                      <tr key={prize.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: prize.color }} />
                            <span className="text-white font-medium">{prize.icon} {prize.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge text-xs ${PRIZE_TYPE_COLORS[prize.type] || 'bg-slate-700 text-slate-300'}`}>
                            {PRIZE_TYPE_LABELS[prize.type] || prize.type}
                          </span>
                        </td>
                        <td className="text-slate-300">{persianNum(prize.value)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-700 rounded-full h-2 w-20">
                              <div className="h-2 rounded-full" style={{ width: `${(prize.probabilityWeight / maxWeight) * 100}%`, backgroundColor: prize.color }} />
                            </div>
                            <span className="text-slate-400 text-xs w-6">{persianNum(prize.probabilityWeight)}</span>
                          </div>
                        </td>
                        <td className="text-slate-300">
                          {totalWeight > 0 ? persianNum(((prize.probabilityWeight / totalWeight) * 100).toFixed(1)) : '۰'}٪
                        </td>
                        <td><Toggle checked={prize.isActive} onChange={() => handleToggle(prize)} /></td>
                        <td>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(prize)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteId(prize.id)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400">
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
          </div>

          <div className="admin-card">
            <h3 className="section-title">نمودار احتمال</h3>
            {active.length > 0 ? (
              <Doughnut
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11, family: 'Vazirmatn' } } },
                    tooltip: { backgroundColor: '#1e293b' },
                  },
                  cutout: '60%',
                }}
              />
            ) : (
              <p className="text-center text-slate-500 text-sm py-8">جایزه فعالی وجود ندارد</p>
            )}
            <p className="text-center text-slate-500 text-xs mt-3">مجموع وزن: {persianNum(totalWeight)}</p>
          </div>
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'ویرایش جایزه' : 'جایزه جدید'}
        size="md"
        footer={
          <>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary">انصراف</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">نام جایزه *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="مثال: ۵۰ سکه" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">نوع</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="select-field" disabled={!!editId}>
                {Object.entries(PRIZE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">ارزش</label>
              <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: Number(e.target.value) }))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label-field">وزن احتمال (عدد بزرگ‌تر = احتمال بیشتر)</label>
            <input type="number" min={1} value={form.weight} onChange={e => setForm(p => ({ ...p, weight: Number(e.target.value) }))} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">آیکون (ایموجی)</label>
              <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="input-field" disabled={!!editId} />
            </div>
            <div>
              <label className="label-field">رنگ</label>
              <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-full h-10 rounded-lg cursor-pointer bg-transparent border border-slate-600" disabled={!!editId} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            فعال باشد
          </label>
          {editId && <p className="text-xs text-slate-500">نوع، آیکون و رنگ پس از ایجاد قابل ویرایش نیستند.</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف جایزه"
        description="آیا از حذف این جایزه اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
