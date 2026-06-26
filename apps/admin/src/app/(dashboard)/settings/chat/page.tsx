'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SectionHeader } from '@/components/ui';
import { FiMessageCircle, FiSave, FiAlertCircle } from 'react-icons/fi';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

interface ChatSettings {
  chatEnabled: boolean;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  maxMessageLength: number;
  fileUploadEnabled: boolean;
  maxFileSize: number;
  allowedFileTypes: string;
  chatRetentionDays: number;
  offlineMessage: string;
  operatorResponseSLA: number;
  ratingEnabled: boolean;
  typingIndicator: boolean;
  readReceipts: boolean;
}

const defaults: ChatSettings = {
  chatEnabled: true,
  autoReplyEnabled: true,
  autoReplyMessage: 'سلام! پیام شما دریافت شد. اپراتور ما به زودی پاسخ می‌دهد.',
  maxMessageLength: 1000,
  fileUploadEnabled: true,
  maxFileSize: 5,
  allowedFileTypes: 'jpg,png,pdf,mp4',
  chatRetentionDays: 90,
  offlineMessage: 'در حال حاضر آفلاین هستیم. ساعت کاری: ۹ صبح تا ۱۲ شب',
  operatorResponseSLA: 5,
  ratingEnabled: true,
  typingIndicator: true,
  readReceipts: true,
};

const FIELD_MAP: Record<string, string> = {
  maxMessageLength: 'chat.maxMessageLength',
  operatorResponseSLA: 'chat.rateLimit',
  autoReplyMessage: 'chat.autoReplyMessage',
  offlineMessage: 'chat.offlineMessage',
};

export default function ChatSettingsPage() {
  const { loading, saving, saved, save, values } = useAdminSettings('chat', FIELD_MAP, defaults);

  const { register, handleSubmit, watch, setValue, reset } = useForm<ChatSettings>({ defaultValues: defaults });

  useEffect(() => {
    if (!loading) reset(values);
  }, [loading, values, reset]);

  const toggles = {
    chatEnabled: watch('chatEnabled'),
    autoReplyEnabled: watch('autoReplyEnabled'),
    fileUploadEnabled: watch('fileUploadEnabled'),
    ratingEnabled: watch('ratingEnabled'),
    typingIndicator: watch('typingIndicator'),
    readReceipts: watch('readReceipts'),
  };

  const onSubmit = async (data: ChatSettings) => {
    await save(data);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="تنظیمات چت"
        subtitle="پیکربندی سیستم چت زنده و پیام‌رسانی"
        icon={<FiMessageCircle />}
      />

      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="text-green-400 w-5 h-5" />
          <span className="text-green-400 text-sm">تنظیمات چت ذخیره شد.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Chat */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">تنظیمات پایه‌ای چت</h3>
          <div className="space-y-4">
            {[
              { key: 'chatEnabled', label: 'چت فعال', desc: 'سیستم چت زنده برای کاربران' },
              { key: 'typingIndicator', label: 'نشانگر تایپ', desc: 'نمایش وضعیت "در حال نوشتن..."' },
              { key: 'readReceipts', label: 'تیک دیده شده', desc: 'نمایش وضعیت خوانده شدن پیام' },
              { key: 'ratingEnabled', label: 'امتیازدهی به چت', desc: 'درخواست امتیاز پس از پایان چت' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-750 rounded-lg border border-slate-600">
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue(item.key as any, !(toggles as any)[item.key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(toggles as any)[item.key] ? 'bg-green-500' : 'bg-slate-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(toggles as any)[item.key] ? 'translate-x-1' : 'translate-x-6'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Auto Reply */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">پاسخ خودکار</h3>
            <button
              type="button"
              onClick={() => setValue('autoReplyEnabled', !toggles.autoReplyEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${toggles.autoReplyEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggles.autoReplyEnabled ? 'translate-x-1' : 'translate-x-6'}`} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">متن پاسخ خودکار</label>
              <textarea {...register('autoReplyMessage')} rows={3} className="input-field w-full resize-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">پیام آفلاین</label>
              <textarea {...register('offlineMessage')} rows={3} className="input-field w-full resize-none" />
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-5">محدودیت‌ها</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">حداکثر طول پیام (کاراکتر)</label>
              <input type="number" {...register('maxMessageLength', { valueAsNumber: true })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">SLA پاسخ اپراتور (دقیقه)</label>
              <input type="number" {...register('operatorResponseSLA', { valueAsNumber: true })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">نگهداری تاریخچه (روز)</label>
              <input type="number" {...register('chatRetentionDays', { valueAsNumber: true })} className="input-field w-full" />
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">آپلود فایل در چت</h3>
            <button
              type="button"
              onClick={() => setValue('fileUploadEnabled', !toggles.fileUploadEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${toggles.fileUploadEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggles.fileUploadEnabled ? 'translate-x-1' : 'translate-x-6'}`} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">حداکثر حجم فایل (MB)</label>
              <input type="number" {...register('maxFileSize', { valueAsNumber: true })} className="input-field w-full" min={1} max={50} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">فرمت‌های مجاز</label>
              <input {...register('allowedFileTypes')} className="input-field w-full" placeholder="jpg,png,pdf,mp4" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6 py-2.5">
            <FiSave className="w-4 h-4" />
            {loading ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </div>
      </form>
    </div>
  );
}
