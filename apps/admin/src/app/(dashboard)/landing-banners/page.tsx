'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowDown, ArrowUp, ImagePlus, RefreshCw, Save, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog, EmptyState, SectionHeader, Toggle } from '@/components/ui';
import { landingBannersApi } from '@/lib/api';
import type { LandingBanner } from '@/lib/types';
import { persianNum } from '@/lib/utils/format';

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(
  /\/api\/v1\/?$/,
  '',
);

function unwrap<T = unknown>(res: { data?: unknown }): T {
  const d = res?.data as { data?: T } | T | undefined;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

function resolveMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}

function bannerFormData(
  values: Partial<LandingBanner>,
  file?: File | null,
) {
  const fd = new FormData();
  fd.append('title', values.title ?? '');
  fd.append('altText', values.altText ?? '');
  fd.append('href', values.href ?? '');
  fd.append('displayOrder', String(values.displayOrder ?? 0));
  fd.append('isActive', String(values.isActive ?? true));
  if (file) fd.append('image', file);
  return fd;
}

export default function LandingBannersPage() {
  const [banners, setBanners] = useState<LandingBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Partial<LandingBanner>>>({});
  const [replacementFiles, setReplacementFiles] = useState<Record<string, File | null>>({});
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newDraft, setNewDraft] = useState<Partial<LandingBanner>>({
    title: '',
    altText: '',
    href: '',
    displayOrder: 0,
    isActive: true,
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await landingBannersApi.getAll();
      const list = unwrap<LandingBanner[]>(res) ?? [];
      setBanners(list);
      setDrafts({});
      setReplacementFiles({});
      setNewDraft((prev) => ({ ...prev, displayOrder: list.length }));
    } catch {
      toast.error('خطا در بارگذاری بنرها');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setNewFile(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop,
    disabled: creating,
  });

  const getDraft = (banner: LandingBanner): Partial<LandingBanner> =>
    drafts[banner.id] ?? banner;

  const patchDraft = (id: string, patch: Partial<LandingBanner>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? banners.find((banner) => banner.id === id)), ...patch },
    }));
  };

  const handleCreate = async () => {
    if (!newFile) {
      toast.error('ابتدا تصویر بنر را انتخاب کنید');
      return;
    }

    setCreating(true);
    try {
      await landingBannersApi.create(bannerFormData(newDraft, newFile));
      toast.success('بنر اضافه شد');
      setNewFile(null);
      setNewDraft({ title: '', altText: '', href: '', displayOrder: banners.length + 1, isActive: true });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در افزودن بنر');
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (banner: LandingBanner) => {
    const draft = getDraft(banner);
    setSavingId(banner.id);
    try {
      await landingBannersApi.update(
        banner.id,
        bannerFormData(draft, replacementFiles[banner.id]),
      );
      toast.success('بنر ذخیره شد');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در ذخیره بنر');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await landingBannersApi.delete(deleteId);
      toast.success('بنر حذف شد');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در حذف بنر');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const moveBanner = async (id: string, direction: -1 | 1) => {
    const next = [...banners];
    const index = next.findIndex((banner) => banner.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= next.length) return;

    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    setBanners(next.map((banner, displayOrder) => ({ ...banner, displayOrder })));

    try {
      await landingBannersApi.reorder(next.map((banner) => banner.id));
      await load();
    } catch {
      toast.error('خطا در تغییر ترتیب بنرها');
      await load();
    }
  };

  return (
    <div className="fade-in space-y-6">
      <SectionHeader
        title="بنرهای صفحهٔ اصلی"
        subtitle="مدیریت بنر عریض زیر هیرو و نزدیک اسکرول دسته‌بندی‌ها"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'بنرهای صفحهٔ اصلی' }]}
        actions={
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm">
            <RefreshCw className="w-4 h-4" /> بروزرسانی
          </button>
        }
      />

      <div className="admin-card p-5 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5">
          <div
            {...getRootProps()}
            className={`rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-red-500 bg-red-500/5' : 'border-slate-700 hover:border-slate-600'
            } ${creating ? 'opacity-60 cursor-wait' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-red-400' : 'text-slate-600'}`} />
            <p className="text-slate-300 text-sm">
              {newFile ? newFile.name : 'تصویر بنر جدید را بکشید یا انتخاب کنید'}
            </p>
            <p className="text-slate-600 text-xs mt-1">نسبت پیشنهادی نزدیک ۴.۱:۱، خروجی خودکار WebP</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">عنوان داخلی</label>
              <input
                className="input-field w-full"
                value={newDraft.title ?? ''}
                onChange={(e) => setNewDraft((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-field">متن جایگزین</label>
              <input
                className="input-field w-full"
                value={newDraft.altText ?? ''}
                onChange={(e) => setNewDraft((prev) => ({ ...prev, altText: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-field">لینک اختیاری</label>
              <input
                className="input-field w-full ltr:text-left"
                value={newDraft.href ?? ''}
                onChange={(e) => setNewDraft((prev) => ({ ...prev, href: e.target.value }))}
                placeholder="/games"
              />
            </div>
            <div>
              <label className="label-field">ترتیب نمایش</label>
              <input
                type="number"
                className="input-field w-full"
                value={newDraft.displayOrder ?? 0}
                onChange={(e) => setNewDraft((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between gap-3">
              <Toggle
                checked={newDraft.isActive !== false}
                onChange={(v) => setNewDraft((prev) => ({ ...prev, isActive: v }))}
                label="فعال"
              />
              <button
                type="button"
                disabled={creating}
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm disabled:opacity-50"
              >
                <ImagePlus className="w-4 h-4" />
                {creating ? 'در حال افزودن...' : 'افزودن بنر'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-card max-w-5xl p-8 text-center text-slate-400">در حال بارگذاری...</div>
      ) : banners.length === 0 ? (
        <EmptyState title="بنری ثبت نشده" description="از فرم بالا اولین بنر صفحهٔ اصلی را بارگذاری کنید." />
      ) : (
        <div className="max-w-5xl space-y-4">
          {banners.map((banner, index) => {
            const draft = getDraft(banner);
            const replacement = replacementFiles[banner.id];
            const previewUrl = resolveMediaUrl(banner.imageUrl);

            return (
              <div key={banner.id} className="admin-card overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 p-4">
                  <div className="space-y-3">
                    <div className="aspect-[4.1/1] overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                      <img
                        src={previewUrl}
                        alt={draft.altText || draft.title || `بنر ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">#{persianNum(index + 1)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveBanner(banner.id, -1)}
                          disabled={index === 0}
                          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-35"
                          title="انتقال به بالا"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBanner(banner.id, 1)}
                          disabled={index === banners.length - 1}
                          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-35"
                          title="انتقال به پایین"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-600 hover:text-white">
                      <Upload className="w-4 h-4" />
                      {replacement ? 'تصویر جایگزین انتخاب شد' : 'جایگزینی تصویر'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setReplacementFiles((prev) => ({ ...prev, [banner.id]: file }));
                        }}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-field">عنوان داخلی</label>
                      <input
                        className="input-field w-full"
                        value={draft.title ?? ''}
                        onChange={(e) => patchDraft(banner.id, { title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label-field">متن جایگزین</label>
                      <input
                        className="input-field w-full"
                        value={draft.altText ?? ''}
                        onChange={(e) => patchDraft(banner.id, { altText: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label-field">لینک اختیاری</label>
                      <input
                        className="input-field w-full ltr:text-left"
                        value={draft.href ?? ''}
                        onChange={(e) => patchDraft(banner.id, { href: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label-field">ترتیب نمایش</label>
                      <input
                        type="number"
                        className="input-field w-full"
                        value={draft.displayOrder ?? 0}
                        onChange={(e) => patchDraft(banner.id, { displayOrder: Number(e.target.value) })}
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                      <Toggle
                        checked={draft.isActive !== false}
                        onChange={(v) => patchDraft(banner.id, { isActive: v })}
                        label="نمایش در صفحهٔ اصلی"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDeleteId(banner.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                          حذف
                        </button>
                        <button
                          type="button"
                          disabled={savingId === banner.id}
                          onClick={() => handleSave(banner)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {savingId === banner.id ? 'در حال ذخیره...' : 'ذخیره'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف بنر"
        description="آیا از حذف این بنر صفحهٔ اصلی اطمینان دارید؟"
        confirmLabel="حذف کن"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
