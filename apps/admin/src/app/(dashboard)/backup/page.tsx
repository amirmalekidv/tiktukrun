'use client';
import { useState, useEffect, useCallback } from 'react';
import { Database, Download, Trash2, Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { SectionHeader, ConfirmDialog, EmptyState } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { backupApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
}

function unwrap<T = unknown>(res: { data?: unknown } | null | undefined): T | null {
  const d = (res as { data?: unknown } | null | undefined)?.data;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return (d as T) ?? null;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '۰ B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${persianNum((bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1))} ${units[i]}`;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteFile, setDeleteFile] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await backupApi.getAll();
      const data = unwrap<BackupFile[]>(res);
      setBackups(Array.isArray(data) ? data : []);
    } catch {
      toast.error('خطا در بارگذاری فهرست پشتیبان‌ها');
      setBackups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await backupApi.create();
      toast.success('پشتیبان‌گیری با موفقیت انجام شد');
      await load();
    } catch {
      toast.error('خطا در پشتیبان‌گیری');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const res = await backupApi.download(filename);
      const blob = res.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('خطا در دانلود فایل');
    }
  };

  const handleDelete = async () => {
    if (!deleteFile) return;
    setDeleting(true);
    try {
      await backupApi.delete(deleteFile);
      toast.success('فایل پشتیبان حذف شد');
      setDeleteFile(null);
      await load();
    } catch {
      toast.error('خطا در حذف فایل');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeader
        title="مدیریت Backup"
        subtitle="پشتیبان‌گیری و بازیابی اطلاعات"
        breadcrumb={[{ label: 'سیستم' }, { label: 'Backup' }]}
        actions={
          <button onClick={handleCreate} disabled={creating} className="btn-primary">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creating ? 'در حال پشتیبان‌گیری...' : 'ایجاد Backup'}
          </button>
        }
      />

      {/* Backups List */}
      <div className="admin-card mb-6">
        <h3 className="section-title">فایل‌های پشتیبان ({persianNum(backups.length)})</h3>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
          </div>
        ) : backups.length === 0 ? (
          <EmptyState title="فایل پشتیبانی موجود نیست" description="برای ایجاد پشتیبان روی «ایجاد Backup» کلیک کنید." />
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div key={backup.filename} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Database className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-mono truncate">{backup.filename}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-slate-500 text-xs">{formatBytes(backup.size)}</span>
                    <span className="text-slate-500 text-xs">{toJalaliDateTime(backup.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(backup.filename)}
                    className="p-2 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white"
                    title="دانلود"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteFile(backup.filename)}
                    className="p-2 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Instructions */}
      <div className="admin-card border-yellow-500/20 bg-yellow-500/5">
        <h3 className="section-title flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          راهنمای بازیابی (Restore)
        </h3>
        <div className="space-y-3 text-sm text-slate-400">
          <p>برای بازیابی پایگاه‌داده MongoDB از فایل پشتیبان، مراحل زیر را دنبال کنید:</p>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs space-y-2" dir="ltr">
            <p className="text-green-400"># 1. Download the backup file to server</p>
            <p className="text-slate-300">scp backup-*.gz user@server:/tmp/</p>
            <p className="text-green-400"># 2. Restore the database</p>
            <p className="text-slate-300">mongorestore --gzip --archive=/tmp/backup-*.gz --drop</p>
            <p className="text-green-400"># 3. Restart the service</p>
            <p className="text-slate-300">pm2 restart all</p>
          </div>
          <p className="text-yellow-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            هشدار: عملیات بازیابی تمام داده‌های موجود را جایگزین می‌کند.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteFile}
        onClose={() => setDeleteFile(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="حذف فایل پشتیبان"
        description="آیا از حذف این فایل پشتیبان اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmLabel="حذف کن"
        variant="danger"
      />
    </div>
  );
}
