'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ArrowDown,
  ArrowUp,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog, EmptyState, SectionHeader, Toggle } from '@/components/ui';
import { platformIntroApi } from '@/lib/api';
import type { PlatformFaq, PlatformIntro } from '@/lib/types';

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

export default function PlatformIntroPage() {
  const [intro, setIntro] = useState<PlatformIntro | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [faqTitle, setFaqTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [clearVideo, setClearVideo] = useState(false);

  const [faqs, setFaqs] = useState<PlatformFaq[]>([]);
  const [faqDrafts, setFaqDrafts] = useState<Record<string, Partial<PlatformFaq>>>({});
  const [savingFaqId, setSavingFaqId] = useState<string | null>(null);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);
  const [deletingFaq, setDeletingFaq] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [creatingFaq, setCreatingFaq] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformIntroApi.get();
      const data = unwrap<PlatformIntro>(res);
      setIntro(data);
      setTitle(data?.title ?? '');
      setFaqTitle(data?.faqTitle ?? '');
      setVideoUrl(data?.videoUrl ?? '');
      setIsActive(data?.isActive ?? true);
      setFaqs(data?.faqs ?? []);
      setFaqDrafts({});
      setVideoFile(null);
      setClearVideo(false);
    } catch {
      toast.error('خطا در بارگذاری معرفی پلتفرم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) {
      setVideoFile(files[0]);
      setClearVideo(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.m4v'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    onDrop,
    disabled: saving,
  });

  const handleSaveIntro = async () => {
    if (!title.trim() || !faqTitle.trim()) {
      toast.error('عنوان بخش و عنوان FAQ الزامی است');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('faqTitle', faqTitle.trim());
      fd.append('isActive', String(isActive));
      if (clearVideo) {
        fd.append('clearVideo', 'true');
      } else if (videoFile) {
        fd.append('video', videoFile);
      } else if (videoUrl.trim()) {
        fd.append('videoUrl', videoUrl.trim());
      }
      await platformIntroApi.update(fd);
      toast.success('تنظیمات معرفی پلتفرم ذخیره شد');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  const getFaqDraft = (faq: PlatformFaq): Partial<PlatformFaq> =>
    faqDrafts[faq.id] ?? faq;

  const patchFaqDraft = (id: string, patch: Partial<PlatformFaq>) => {
    setFaqDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? faqs.find((f) => f.id === id)), ...patch },
    }));
  };

  const handleSaveFaq = async (faq: PlatformFaq) => {
    const draft = getFaqDraft(faq);
    if (!draft.question?.trim() || !draft.answer?.trim()) {
      toast.error('سوال و پاسخ الزامی است');
      return;
    }
    setSavingFaqId(faq.id);
    try {
      await platformIntroApi.updateFaq(faq.id, {
        question: draft.question.trim(),
        answer: draft.answer.trim(),
        isActive: draft.isActive ?? true,
        displayOrder: draft.displayOrder ?? faq.displayOrder,
      });
      toast.success('سوال ذخیره شد');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در ذخیره سوال');
    } finally {
      setSavingFaqId(null);
    }
  };

  const handleCreateFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error('سوال و پاسخ را وارد کنید');
      return;
    }
    setCreatingFaq(true);
    try {
      await platformIntroApi.createFaq({
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim(),
        displayOrder: faqs.length,
        isActive: true,
      });
      toast.success('سوال اضافه شد');
      setNewFaq({ question: '', answer: '' });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در افزودن سوال');
    } finally {
      setCreatingFaq(false);
    }
  };

  const handleDeleteFaq = async () => {
    if (!deleteFaqId) return;
    setDeletingFaq(true);
    try {
      await platformIntroApi.deleteFaq(deleteFaqId);
      toast.success('سوال حذف شد');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا در حذف سوال');
    } finally {
      setDeletingFaq(false);
      setDeleteFaqId(null);
    }
  };

  const moveFaq = async (id: string, direction: -1 | 1) => {
    const next = [...faqs];
    const index = next.findIndex((f) => f.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= next.length) return;

    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    setFaqs(next.map((f, displayOrder) => ({ ...f, displayOrder })));

    try {
      await platformIntroApi.reorderFaqs(next.map((f) => f.id));
      await load();
    } catch {
      toast.error('خطا در تغییر ترتیب');
      await load();
    }
  };

  const [previewSrc, setPreviewSrc] = useState('');

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setPreviewSrc(url);
      return () => URL.revokeObjectURL(url);
    }
    if (clearVideo) {
      setPreviewSrc('');
      return;
    }
    setPreviewSrc(resolveMediaUrl(videoUrl));
  }, [videoFile, clearVideo, videoUrl]);

  if (loading) {
    return (
      <div className="fade-in space-y-6">
        <SectionHeader
          title="معرفی پلتفرم"
          subtitle="ویدیو و سوالات متداول صفحهٔ اصلی"
          breadcrumb={[{ label: 'داشبورد' }, { label: 'معرفی پلتفرم' }]}
        />
        <div className="admin-card p-8 text-center text-slate-400">در حال بارگذاری…</div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      <SectionHeader
        title="معرفی پلتفرم"
        subtitle="مدیریت ویدیوی معرفی و سوالات متداول صفحهٔ اصلی"
        breadcrumb={[{ label: 'داشبورد' }, { label: 'معرفی پلتفرم' }]}
        actions={
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> بروزرسانی
          </button>
        }
      />

      <div className="admin-card p-5 max-w-5xl space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-white font-semibold">تنظیمات بخش</h3>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">نمایش در صفحهٔ اصلی</span>
            <Toggle checked={isActive} onChange={setIsActive} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-slate-400 text-sm">عنوان معرفی</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full"
              placeholder="معرفی پلتفرم تیک‌تاک‌ران"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-slate-400 text-sm">عنوان FAQ</span>
            <input
              value={faqTitle}
              onChange={(e) => setFaqTitle(e.target.value)}
              className="input-field w-full"
              placeholder="سوالات متداول اتاق فرار - اسکیپ روم"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5">
          <div
            {...getRootProps()}
            className={`rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-red-500 bg-red-500/5' : 'border-slate-700 hover:border-slate-600'
            } ${saving ? 'opacity-60 cursor-wait' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-red-400' : 'text-slate-600'}`} />
            <p className="text-slate-300 text-sm">
              {videoFile ? videoFile.name : 'ویدیوی معرفی را بکشید یا انتخاب کنید'}
            </p>
            <p className="text-slate-600 text-xs mt-1">mp4 / webm — حداکثر ۱۰۰ مگابایت</p>
          </div>

          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-slate-400 text-sm">یا آدرس ویدیو (URL)</span>
              <input
                value={clearVideo ? '' : videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  setClearVideo(false);
                  setVideoFile(null);
                }}
                className="input-field w-full"
                placeholder="https://… یا /uploads/…"
                disabled={!!videoFile}
              />
            </label>

            {(previewSrc || videoUrl) && !clearVideo && (
              <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-700 aspect-video">
                {previewSrc ? (
                  <video
                    key={previewSrc}
                    src={previewSrc}
                    controls
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500 gap-2">
                    <Video className="w-5 h-5" />
                    پیش‌نمایش در دسترس نیست
                  </div>
                )}
              </div>
            )}

            {(intro?.videoUrl || videoFile) && !clearVideo && (
              <button
                type="button"
                onClick={() => {
                  setClearVideo(true);
                  setVideoFile(null);
                  setVideoUrl('');
                }}
                className="text-sm text-red-400 hover:text-red-300"
              >
                حذف ویدیو
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveIntro}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات و ویدیو'}
          </button>
        </div>
      </div>

      <div className="admin-card p-5 max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-white font-semibold">سوالات متداول</h3>
          <span className="text-slate-500 text-xs">{faqs.length} سوال</span>
        </div>

        <div className="rounded-xl border border-slate-700/80 p-4 space-y-3 bg-slate-900/40">
          <p className="text-slate-400 text-sm">سوال جدید</p>
          <input
            value={newFaq.question}
            onChange={(e) => setNewFaq((p) => ({ ...p, question: e.target.value }))}
            className="input-field w-full"
            placeholder="متن سوال"
          />
          <textarea
            value={newFaq.answer}
            onChange={(e) => setNewFaq((p) => ({ ...p, answer: e.target.value }))}
            className="input-field w-full min-h-[88px]"
            placeholder="پاسخ"
          />
          <button
            onClick={handleCreateFaq}
            disabled={creatingFaq}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {creatingFaq ? 'در حال افزودن…' : 'افزودن سوال'}
          </button>
        </div>

        {faqs.length === 0 ? (
          <EmptyState title="سوالی ثبت نشده" description="اولین سوال متداول را اضافه کنید" />
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const draft = getFaqDraft(faq);
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-slate-700/80 p-4 space-y-3 bg-slate-900/30"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveFaq(faq.id, -1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFaq(faq.id, 1)}
                        disabled={index === faqs.length - 1}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <span className="text-slate-500 text-xs">#{index + 1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">فعال</span>
                      <Toggle
                        checked={draft.isActive ?? true}
                        onChange={(v) => patchFaqDraft(faq.id, { isActive: v })}
                      />
                    </div>
                  </div>

                  <input
                    value={draft.question ?? ''}
                    onChange={(e) => patchFaqDraft(faq.id, { question: e.target.value })}
                    className="input-field w-full"
                    placeholder="سوال"
                  />
                  <textarea
                    value={draft.answer ?? ''}
                    onChange={(e) => patchFaqDraft(faq.id, { answer: e.target.value })}
                    className="input-field w-full min-h-[88px]"
                    placeholder="پاسخ"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteFaqId(faq.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> حذف
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveFaq(faq)}
                      disabled={savingFaqId === faq.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      {savingFaqId === faq.id ? '…' : 'ذخیره'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteFaqId}
        onClose={() => setDeleteFaqId(null)}
        onConfirm={handleDeleteFaq}
        loading={deletingFaq}
        title="حذف سوال"
        description="این سوال از لیست FAQ حذف می‌شود. ادامه می‌دهید؟"
        confirmLabel="حذف"
      />
    </div>
  );
}
