'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Copy, Percent, Tag, RefreshCw } from 'lucide-react';
import { SectionHeader, StatsCard, FilterBar, Toggle, ConfirmDialog, Pagination, Modal, EmptyState } from '@/components/ui';
import { toJalali, persianNum, formatToman } from '@/lib/utils/format';
import { discountsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface DiscountCode {
  id: string;
  code: string;
  name?: string | null;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minPurchase?: number;
  maxDiscount?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

const PAGE_SIZE = 20;

function unwrapPaginated(res: { data?: unknown } | null | undefined): { items: DiscountCode[]; total: number } {
  const d = (res as { data?: unknown } | null | undefined)?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    const inner = d as { data: DiscountCode[]; total?: number };
    return { items: Array.isArray(inner.data) ? inner.data : [], total: inner.total ?? inner.data?.length ?? 0 };
  }
  const arr = Array.isArray(d) ? (d as DiscountCode[]) : [];
  return { items: arr, total: arr.length };
}

interface FormState {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: string;
  minPurchase: string;
  maxDiscount: string;
  validFrom: string;
  validUntil: string;
  maxUses: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  code: '', type: 'PERCENT', value: '', minPurchase: '', maxDiscount: '',
  validFrom: '', validUntil: '', maxUses: '', isActive: true,
};

export default function DiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await discountsApi.getCodes({ page, limit: PAGE_SIZE });
      const { items, total: t } = unwrapPaginated(res);
      setCodes(items);
      setTotal(t);
    } catch {
      toast.error('خطا در بارگذاری کدهای تخفیف');
      setCodes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = codes.filter((c) => !search || c.code.toLowerCase().includes(search.toLowerCase()));

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`کد ${code} کپی شد`);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: DiscountCode) => {
    setEditId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minPurchase: c.minPurchase ? String(c.minPurchase) : '',
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '',
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : '',
      validUntil: c.validUntil ? c.validUntil.slice(0, 10) : '',
      maxUses: c.maxUses ? String(c.maxUses) : '',
      isActive: c.isActive,
    });
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.code.trim() || !form.value) {
      toast.error('کد و مقدار الزامی است');
      return;
    }
    setSaving(true);
    try {
      const validFrom = form.validFrom ? new Date(form.validFrom).toISOString() : new Date().toISOString();
      const validUntil = form.validUntil ? new Date(form.validUntil).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();
      if (editId) {
        await discountsApi.updateCode(editId, {
          type: form.type,
          value: Number(form.value),
          minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          validFrom,
          validUntil,
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          isActive: form.isActive,
        } as Record<string, unknown>);
        toast.success('کد به‌روزرسانی شد');
      } else {
        await discountsApi.createCode({
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: Number(form.value),
          minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          validFrom,
          validUntil,
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          isActive: form.isActive,
        } as Record<string, unknown>);
        toast.success('کد ایجاد شد');
      }
      setShowForm(false);
      await load();
    } catch {
      toast.error('خطا در ذخیره کد تخفیف');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: DiscountCode) => {
    setCodes((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: !x.isActive } : x)));
    try {
      await discountsApi.updateCode(c.id, { isActive: !c.isActive } as Record<string, unknown>);
    } catch {
      toast.error('خطا در تغییر وضعیت');
      setCodes((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: c.isActive } : x)));
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await discountsApi.deleteCode(deleteId);
      toast.success('کد حذف شد');
      setDeleteId(null);
      await load();
    } catch {
      toast.error('خطا در حذف کد');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCount = codes.filter((c) => c.isActive).length;
  const totalUsed = codes.reduce((s, c) => s + (c.usedCount ?? 0), 0);

  const stats = [
    { label: 'کد فعال', value: persianNum(activeCount), color: 'green' as const, icon: <Tag className="w-5 h-5" /> },
    { label: 'کل استفاده', value: persianNum(totalUsed), color: 'blue' as const, icon: <Percent className="w-5 h-5" /> },
    { label: 'تعداد کل کدها', value: persianNum(total), color: 'red' as const, icon: <Percent className="w-5 h-5" /> },
  ];

  return (
    <div className="fade-in">
      <SectionHeader
        title="کدهای تخفیف"
        breadcrumb={[{ label: 'تخفیف‌ها' }, { label: 'کدها' }]}
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> کد جدید
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <FilterBar onReset={() => setSearch('')}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="جستجو کد..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" />
        </div>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="کد تخفیفی یافت نشد" description="برای ایجاد کد جدید روی «کد جدید» کلیک کنید." />
      ) : (
        <div className="admin-card">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>کد</th>
                  <th>نوع</th>
                  <th>مقدار</th>
                  <th>حداقل خرید</th>
                  <th>اعتبار تا</th>
                  <th>استفاده</th>
                  <th>فعال</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((code) => (
                  <tr key={code.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono font-bold">{code.code}</span>
                        <button onClick={() => copyCode(code.code)} className="text-slate-500 hover:text-slate-300">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-slate-700 text-slate-300 text-xs">
                        {code.type === 'PERCENT' ? 'درصدی' : 'ثابت'}
                      </span>
                    </td>
                    <td className="text-white font-bold">
                      {code.type === 'PERCENT' ? `${persianNum(code.value)}٪` : formatToman(code.value)}
                    </td>
                    <td className="text-slate-400">{code.minPurchase ? formatToman(code.minPurchase) : '—'}</td>
                    <td className="text-slate-400 text-sm">{code.validUntil ? toJalali(code.validUntil) : '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5 w-24">
                          <div
                            className="bg-red-500 h-1.5 rounded-full"
                            style={{ width: code.maxUses ? `${Math.min((code.usedCount / code.maxUses) * 100, 100)}%` : '0%' }}
                          />
                        </div>
                        <span className="text-slate-400 text-xs">{persianNum(code.usedCount)}/{code.maxUses ? persianNum(code.maxUses) : '∞'}</span>
                      </div>
                    </td>
                    <td>
                      <Toggle checked={code.isActive} onChange={() => toggleActive(code)} />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(code)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(code.id)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'ویرایش کد تخفیف' : 'کد تخفیف جدید'}
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn-secondary">انصراف</button>
            <button onClick={submitForm} disabled={saving} className="btn-primary">
              {saving ? 'در حال ذخیره...' : editId ? 'ذخیره' : 'ایجاد'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">کد</label>
            <input value={form.code} disabled={!!editId} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} className="input-field w-full" placeholder="NOWRUZ1403" />
          </div>
          <div>
            <label className="label-field">نوع</label>
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as 'PERCENT' | 'FIXED' }))} className="input-field w-full">
              <option value="PERCENT">درصدی</option>
              <option value="FIXED">مبلغ ثابت</option>
            </select>
          </div>
          <div>
            <label className="label-field">مقدار {form.type === 'PERCENT' ? '(٪)' : '(تومان)'}</label>
            <input type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="label-field">حداقل خرید (تومان)</label>
            <input type="number" value={form.minPurchase} onChange={(e) => setForm((p) => ({ ...p, minPurchase: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="label-field">حداکثر تخفیف (تومان)</label>
            <input type="number" value={form.maxDiscount} onChange={(e) => setForm((p) => ({ ...p, maxDiscount: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="label-field">حداکثر دفعات استفاده</label>
            <input type="number" value={form.maxUses} onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="label-field">اعتبار از</label>
            <input type="date" value={form.validFrom} onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="label-field">اعتبار تا</label>
            <input type="date" value={form.validUntil} onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))} className="input-field w-full" />
          </div>
          <div className="col-span-2 flex items-center gap-3">
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
        title="حذف کد تخفیف"
        description="آیا از حذف این کد اطمینان دارید؟"
        confirmLabel="حذف"
        variant="danger"
      />
    </div>
  );
}
