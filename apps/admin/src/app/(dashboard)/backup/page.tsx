'use client';
import { useState } from 'react';
import { Database, Download, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { SectionHeader, ConfirmDialog } from '@/components/ui';
import { toJalaliDateTime, persianNum } from '@/lib/utils/format';
import { backupApi } from '@/lib/api';
import toast from 'react-hot-toast';

const MOCK_BACKUPS = [
  { id: 'bk1', filename: 'backup_full_1403-03-12_02-00.tar.gz', size: '2.4 GB', type: 'FULL', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'bk2', filename: 'backup_db_1403-03-11_02-00.sql.gz', size: '145 MB', type: 'DB', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'bk3', filename: 'backup_full_1403-03-10_02-00.tar.gz', size: '2.3 GB', type: 'FULL', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'bk4', filename: 'backup_db_1403-03-09_02-00.sql.gz', size: '140 MB', type: 'DB', createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
];

export default function BackupPage() {
  const [backups, setBackups] = useState(MOCK_BACKUPS);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    setProgress(0);
    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) { clearInterval(interval); return prev; }
          return prev + Math.random() * 15;
        });
      }, 500);

      await new Promise(r => setTimeout(r, 5000));
      clearInterval(interval);
      setProgress(100);

      const newBackup = {
        id: `bk${Date.now()}`,
        filename: `backup_full_${new Date().toISOString().slice(0, 10)}_manual.tar.gz`,
        size: '2.5 GB',
        type: 'FULL',
        createdAt: new Date().toISOString(),
      };
      setBackups(prev => [newBackup, ...prev]);
      toast.success('پشتیبان‌گیری با موفقیت انجام شد');
    } catch {
      toast.error('خطا در پشتیبان‌گیری');
    } finally {
      setCreating(false);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await backupApi.delete(deleteId);
      setBackups(prev => prev.filter(b => b.id !== deleteId));
      toast.success('فایل پشتیبان حذف شد');
    } catch {
      toast.error('خطا');
    } finally {
      setDeleteId(null);
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

      {/* Progress Indicator */}
      {creating && (
        <div className="admin-card mb-6 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-white font-medium">در حال ایجاد پشتیبان...</span>
            <span className="text-blue-400 mr-auto">{Math.round(progress)}٪</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">لطفاً صبر کنید. این فرایند ممکن است چند دقیقه طول بکشد.</p>
        </div>
      )}

      {/* Backups List */}
      <div className="admin-card mb-6">
        <h3 className="section-title">فایل‌های پشتیبان ({persianNum(backups.length)})</h3>
        <div className="space-y-2">
          {backups.map(backup => (
            <div key={backup.id} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
              <div className={`p-2 rounded-lg ${backup.type === 'FULL' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                <Database className={`w-5 h-5 ${backup.type === 'FULL' ? 'text-red-400' : 'text-blue-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-mono truncate">{backup.filename}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-slate-500 text-xs">{backup.size}</span>
                  <span className={`badge text-xs ${backup.type === 'FULL' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {backup.type}
                  </span>
                  <span className="text-slate-500 text-xs">{toJalaliDateTime(backup.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toast.success('دانلود شروع شد')}
                  className="p-2 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(backup.id)}
                  className="p-2 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Restore Instructions */}
      <div className="admin-card border-yellow-500/20 bg-yellow-500/5">
        <h3 className="section-title flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          راهنمای بازیابی (Restore)
        </h3>
        <div className="space-y-3 text-sm text-slate-400">
          <p>برای بازیابی از فایل پشتیبان، مراحل زیر را دنبال کنید:</p>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs space-y-2">
            <p className="text-green-400"># ۱. دانلود فایل backup به سرور</p>
            <p className="text-slate-300">scp backup_full_*.tar.gz user@server:/tmp/</p>
            <p className="text-green-400"># ۲. متوقف کردن سرویس</p>
            <p className="text-slate-300">pm2 stop all</p>
            <p className="text-green-400"># ۳. بازیابی فایل‌ها</p>
            <p className="text-slate-300">tar -xzf /tmp/backup_full_*.tar.gz -C /</p>
            <p className="text-green-400"># ۴. ری‌استارت سرویس</p>
            <p className="text-slate-300">pm2 restart all</p>
          </div>
          <p className="text-yellow-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            هشدار: عملیات بازیابی تمام داده‌های موجود را جایگزین می‌کند.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف فایل پشتیبان"
        description="آیا از حذف این فایل پشتیبان اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmLabel="حذف کن"
        variant="danger"
      />
    </div>
  );
}
