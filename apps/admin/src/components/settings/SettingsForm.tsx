'use client';
import { useState, ReactNode } from 'react';
import { Save, Loader2, RotateCcw } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface SettingsFormProps {
  group: string;
  title: string;
  description?: string;
  children: ReactNode;
  onSave?: (data: Record<string, unknown>) => void;
}

export default function SettingsForm({ group, title, description, children, onSave }: SettingsFormProps) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data: Record<string, unknown> = {};
      formData.forEach((val, key) => {
        data[key] = val;
      });

      await settingsApi.bulkUpdate(
        Object.entries(data).map(([key, value]) => ({
          key: key.includes('.') ? key : `${group}.${key}`,
          value: String(value),
        })),
      );
      onSave?.(data);
      toast.success('تنظیمات ذخیره شد');
    } catch {
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="admin-card">
        <div className="mb-6 pb-4 border-b border-slate-700">
          <h2 className="text-white font-bold text-xl">{title}</h2>
          {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
        </div>
        <div className="space-y-6">
          {children}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          ذخیره تنظیمات
        </button>
        <button type="reset" className="btn-ghost">
          <RotateCcw className="w-4 h-4" />
          بازنشانی
        </button>
      </div>
    </form>
  );
}
