'use client';
import { useState, useEffect, useCallback } from 'react';
import { Edit, Plus, Trash2, RefreshCw } from 'lucide-react';
import { SectionHeader, Toggle, Modal, EmptyState, ConfirmDialog } from '@/components/ui';
import { persianNum } from '@/lib/utils/format';
import { discountsApi } from '@/lib/api';
import toast from 'react-hot-toast';

type RuleType = 'VIP' | 'WEEKLY' | 'FIRST_BOOKING' | 'BIRTHDAY' | 'INVITE';

interface AutoDiscount {
  id: string;
  name: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  ruleType: RuleType;
  conditions?: Record<string, unknown> | null;
  isActive: boolean;
}

const TRIGGER_LABELS: Record<RuleType, string> = {
  VIP: '👑 VIP',
  WEEKLY: '📅 هفتگی',
  FIRST_BOOKING: '🎯 اولین رزرو',
  BIRTHDAY: '🎂 تولد',
  INVITE: '🤝 دعوت',
};

function unwrap<T = unknown>(res: { data?: unknown } | null | undefined): T | null {
  const d = (res as { data?: unknown } | null | undefined)?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return (d as T) ?? null;
}

interface FormState {
  name: string;
  ruleType: RuleType;
  type: 'PERCENT' | 'FIXED';
  value: string;
  conditions: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  name: '', ruleType: 'VIP', type: 'PERCENT', value: '', conditions: '{}', isActive: true,
};

export default function AutoDiscountsPage() {
  const [discounts, setDiscounts] = useState<AutoDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await discountsApi.getAutoDiscounts();
      const data = unwrap<AutoDiscount[]>(res);
      setDiscounts(Array.isArray(data) ? data : []);
    } catch {
      toast.error('خطا در بارگذاری تخفیف‌های خودکار');
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (d: AutoDiscount) => {
    setEditId(d.id);
    setForm({
      name: d.name,
      ruleType: d.ruleType,
      type: d.type,
      value: String(d.value),
      conditions: JSON.stringify(d.conditions ?? {}, null, 2),
      isActive: d.isActive,
    });
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.name.trim() || !form.value) {
      toast.error('نام و مقدار الزامی است');
      return;
    }
    let conditions: Record<string, unknown> | undefined;
    try {
      conditions = form.conditions.trim() ? JSON.parse(form.conditions) : undefined;
    } catch {
      toast.error('قالب JSON شرایط نامعتبر است');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await discountsApi.updateAutoDiscount(editId, {
          name: form.name.trim(),
          type: form.type,
          value: Number(form.value),
          conditions,
          isActive: form.isActive,
        } as Record<string, unknown>);
        toast.success('تخفیف به‌روزرسانی شد');
      } else {
        await discountsApi.createAutoDiscount({
          name: form.name.trim(),
          type: form.type,
          value: Number(form.value),
          ruleType: form.ruleType,
          conditions,
          isActive: form.isActive,
        } as Record<string, unknown>);
        toast.success('تخفیف خودکار ایجاد شد');
      }
      setShowForm(false);
      await load();
    } catch {
      toast.error('خطا در ذخیره تخفیف');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (d: AutoDiscount) => {
    setDiscounts((prev) => prev.map((x) => (x.id === d.id ? { ...x, isActive: !x.isActive } : x)));
    try {
      await discountsApi.updateAutoDiscount(d.id, { isActive: !d.isActive } as Record<string, unknown>);
    } catch {
      toast.error('خطا در تغییر وضعیت');
      setDiscounts((prev) => prev.map((x) => (x.id === d.id ? { ...x, isActive: d.isActive } : x)));
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await discountsApi.deleteAutoDiscount(deleteId);
      toast.success('تخفیف حذف شد');
      setDeleteId(null);
      await load();
    } catch {
      toast.error('خطا در حذف تخفیف');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="تخفیف‌های خودکار"
        subtitle="تخفیف‌هایی که به‌صورت خودکار اعمال می‌شوند"
        breadcrumb={[{ label: 'تخفیف‌ها' }, { label: 'خودکار' }]}
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> تخفیف جدید
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : discounts.length === 0 ? (
        <EmptyState title="تخفیف خودکاری تعریف نشده" description="برای ایجاد تخفیف جدید روی «تخفیف جدید» کلیک کنید." />
      ) : (
        <div className="space-y-4">
          {discounts.map((discount) => (
            <div key={discount.id} className={`admin-card transition-all ${discount.isActive ? 'border-slate-700/50' : 'border-slate-800 opacity-60'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{TRIGGER_LABELS[discount.ruleType]?.split(' ')[0]}</div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-bold text-lg">{discount.name}</h3>
                      <span className="badge bg-slate-700 text-slate-300 text-xs">
                        {TRIGGER_LABELS[discount.ruleType]?.split(' ').slice(1).join(' ')}
                      </span>
                      <span className={`badge ${discount.type === 'PERCENT' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                        {discount.type === 'PERCENT' ? `${persianNum(discount.value)}٪` : `${persianNum(discount.value)} تومان`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => openEdit(discount)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(discount.id)} className="p-2 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Toggle checked={discount.isActive} onChange={() => toggleActive(discount)} />
                </div>
              </div>

              {discount.conditions && Object.keys(discount.conditions).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/30">
                  <p className="text-slate-500 text-xs">
                    شرایط: <code className="text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded" dir="ltr">{JSON.stringify(discount.conditions)}</code>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'ویرایش تخفیف خودکار' : 'تخفیف خودکار جدید'}
        size="md"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn-secondary">انصراف</button>
            <button onClick={submitForm} disabled={saving} className="btn-primary">
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">نام</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-field w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">نوع قانون</label>
              <select value={form.ruleType} disabled={!!editId} onChange={(e) => setForm((p) => ({ ...p, ruleType: e.target.value as RuleType }))} className="select-field w-full">
                {(Object.keys(TRIGGER_LABELS) as RuleType[]).map((k) => (
                  <option key={k} value={k}>{TRIGGER_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">نوع تخفیف</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as 'PERCENT' | 'FIXED' }))} className="select-field w-full">
                <option value="PERCENT">درصدی</option>
                <option value="FIXED">مبلغ ثابت</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">مقدار</label>
            <input type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="label-field">شرایط (JSON)</label>
            <textarea
              value={form.conditions}
              onChange={(e) => setForm((p) => ({ ...p, conditions: e.target.value }))}
              className="input-field font-mono text-sm h-24 resize-none w-full"
              dir="ltr"
            />
          </div>
          <div className="flex items-center gap-3">
            <Toggle checked={form.isActive} onChange={() => setForm((p) => ({ ...p, isActive: !p.isActive }))} />
            <span className="text-slate-300 text-sm">فعال</span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="حذف تخفیف خودکار"
        description="آیا از حذف این تخفیف اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
