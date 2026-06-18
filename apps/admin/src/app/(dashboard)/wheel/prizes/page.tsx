'use client';
import { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { SectionHeader, Toggle, Modal, ConfirmDialog } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import { wheelApi } from '@/lib/api';
import toast from 'react-hot-toast';
import type { WheelPrize } from '@/lib/types';

ChartJS.register(ArcElement, Tooltip, Legend);

const MOCK_PRIZES: WheelPrize[] = [
  { id: 'p1', name: 'هیچی', type: 'NOTHING', value: 0, probabilityWeight: 30, color: '#475569', isActive: true, wonCount: 234 },
  { id: 'p2', name: '۵۰ سکه', type: 'COINS', value: 50, probabilityWeight: 25, color: '#f59e0b', isActive: true, wonCount: 180 },
  { id: 'p3', name: '۲۰۰ سکه', type: 'COINS', value: 200, probabilityWeight: 15, color: '#eab308', isActive: true, wonCount: 98 },
  { id: 'p4', name: '۵ الماس', type: 'DIAMONDS', value: 5, probabilityWeight: 10, color: '#3b82f6', isActive: true, wonCount: 65 },
  { id: 'p5', name: '۵۰۰ XP', type: 'XP', value: 500, probabilityWeight: 12, color: '#8b5cf6', isActive: true, wonCount: 78 },
  { id: 'p6', name: '۲۰٪ تخفیف', type: 'DISCOUNT', value: 20, probabilityWeight: 5, color: '#22c55e', isActive: true, wonCount: 32 },
  { id: 'p7', name: 'بج طلایی', type: 'BADGE', value: 1, probabilityWeight: 3, color: '#dc2626', isActive: true, wonCount: 18 },
];

const PRIZE_TYPE_LABELS: Record<string, string> = {
  NOTHING: 'هیچی', COINS: 'سکه', DIAMONDS: 'الماس', XP: 'XP', DISCOUNT: 'تخفیف', BADGE: 'بج',
};

const PRIZE_TYPE_COLORS: Record<string, string> = {
  NOTHING: 'bg-slate-500/20 text-slate-400',
  COINS: 'bg-yellow-500/20 text-yellow-400',
  DIAMONDS: 'bg-blue-500/20 text-blue-400',
  XP: 'bg-purple-500/20 text-purple-400',
  DISCOUNT: 'bg-green-500/20 text-green-400',
  BADGE: 'bg-red-500/20 text-red-400',
};

export default function WheelPrizesPage() {
  const [prizes, setPrizes] = useState(MOCK_PRIZES);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPrize, setEditPrize] = useState<WheelPrize | null>(null);

  const totalWeight = prizes.filter(p => p.isActive).reduce((sum, p) => sum + p.probabilityWeight, 0);

  const chartData = {
    labels: prizes.filter(p => p.isActive).map(p => p.name),
    datasets: [{
      data: prizes.filter(p => p.isActive).map(p => p.probabilityWeight),
      backgroundColor: prizes.filter(p => p.isActive).map(p => p.color + 'CC'),
      borderColor: prizes.filter(p => p.isActive).map(p => p.color),
      borderWidth: 2,
    }],
  };

  const handleToggle = (id: string) => {
    setPrizes(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const handleDelete = () => {
    setPrizes(prev => prev.filter(p => p.id !== deleteId));
    toast.success('جایزه حذف شد');
    setDeleteId(null);
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت جوایز گردونه"
        subtitle="تنظیم جوایز و احتمال‌های گردونه شانس"
        breadcrumb={[{ label: 'گردونه شانس' }, { label: 'جوایز' }]}
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> جایزه جدید
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prizes Table */}
        <div className="lg:col-span-2">
          <div className="admin-card">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>نام جایزه</th>
                    <th>نوع</th>
                    <th>ارزش</th>
                    <th>وزن احتمال</th>
                    <th>احتمال</th>
                    <th>تعداد برنده</th>
                    <th>فعال</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {prizes.map((prize, i) => (
                    <tr key={prize.id}>
                      <td>
                        <button className="text-slate-600 hover:text-slate-400 cursor-grab">
                          <GripVertical className="w-4 h-4" />
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: prize.color }} />
                          <span className="text-white font-medium">{prize.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge text-xs ${PRIZE_TYPE_COLORS[prize.type]}`}>
                          {PRIZE_TYPE_LABELS[prize.type]}
                        </span>
                      </td>
                      <td className="text-slate-300">{persianNum(prize.value)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700 rounded-full h-2 w-20">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${(prize.probabilityWeight / Math.max(...prizes.map(p => p.probabilityWeight))) * 100}%`,
                                backgroundColor: prize.color,
                              }}
                            />
                          </div>
                          <span className="text-slate-400 text-xs w-6">{prize.probabilityWeight}</span>
                        </div>
                      </td>
                      <td className="text-slate-300">
                        {totalWeight > 0 ? ((prize.probabilityWeight / totalWeight) * 100).toFixed(1) : 0}٪
                      </td>
                      <td className="text-slate-400">{persianNum(prize.wonCount || 0)}</td>
                      <td>
                        <Toggle checked={prize.isActive} onChange={() => handleToggle(prize.id)} />
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditPrize(prize); setShowForm(true); }} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
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

        {/* Pie Preview */}
        <div className="admin-card">
          <h3 className="section-title">نمودار احتمال</h3>
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
          <p className="text-center text-slate-500 text-xs mt-3">مجموع وزن: {persianNum(totalWeight)}</p>
        </div>
      </div>

      {/* Prize Form Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditPrize(null); }}
        title={editPrize ? 'ویرایش جایزه' : 'جایزه جدید'}
        size="md"
        footer={
          <>
            <button onClick={() => { setShowForm(false); setEditPrize(null); }} className="btn-secondary">انصراف</button>
            <button
              onClick={() => {
                toast.success(editPrize ? 'جایزه بروزرسانی شد' : 'جایزه اضافه شد');
                setShowForm(false);
                setEditPrize(null);
              }}
              className="btn-primary"
            >
              ذخیره
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">نام جایزه *</label>
            <input defaultValue={editPrize?.name} className="input-field" placeholder="مثال: ۵۰ سکه" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">نوع</label>
              <select defaultValue={editPrize?.type || 'COINS'} className="select-field">
                {Object.entries(PRIZE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">ارزش</label>
              <input type="number" defaultValue={editPrize?.value} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label-field">وزن احتمال (عدد بزرگ‌تر = احتمال بیشتر)</label>
            <input type="number" min={1} defaultValue={editPrize?.probabilityWeight || 10} className="input-field" />
          </div>
          <div>
            <label className="label-field">رنگ</label>
            <input type="color" defaultValue={editPrize?.color || '#dc2626'} className="w-full h-10 rounded-lg cursor-pointer bg-transparent border border-slate-600" />
          </div>
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
