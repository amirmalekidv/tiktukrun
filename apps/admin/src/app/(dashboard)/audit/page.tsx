'use client';

import { useState } from 'react';
import { SectionHeader } from '@/components/ui';
import { FiActivity, FiFilter, FiDownload, FiAlertTriangle, FiInfo } from 'react-icons/fi';

type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'setting_change' | 'role_change' | 'ban';
type AuditSeverity = 'info' | 'warning' | 'critical';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  severity: AuditSeverity;
  metadata?: Record<string, any>;
  createdAt: string;
}

const MOCK_AUDIT: AuditLog[] = [
  { id: '1', userId: '1', userName: 'علی محمدی', userRole: 'admin', action: 'setting_change', entity: 'settings', entityId: 'general', description: 'تغییر تنظیمات عمومی: نام سایت', ipAddress: '192.168.1.1', userAgent: 'Chrome 120', severity: 'warning', metadata: { field: 'siteName', old: 'TikTak', new: 'تیک تاک ران' }, createdAt: '۱۴۰۳/۰۴/۱۵ ۱۴:۳۲' },
  { id: '2', userId: '2', userName: 'مریم احمدی', userRole: 'operator', action: 'update', entity: 'booking', entityId: 'B-1234', description: 'تغییر وضعیت رزرو به لغو شده', ipAddress: '10.0.0.5', userAgent: 'Firefox 118', severity: 'info', metadata: { old: 'confirmed', new: 'cancelled' }, createdAt: '۱۴۰۳/۰۴/۱۵ ۱۳:۱۵' },
  { id: '3', userId: '1', userName: 'علی محمدی', userRole: 'admin', action: 'delete', entity: 'game', entityId: 'G-55', description: 'حذف بازی "عملیات فرار"', ipAddress: '192.168.1.1', userAgent: 'Chrome 120', severity: 'critical', metadata: { gameName: 'عملیات فرار' }, createdAt: '۱۴۰۳/۰۴/۱۵ ۱۱:۵۰' },
  { id: '4', userId: '3', userName: 'رضا کریمی', userRole: 'accountant', action: 'export', entity: 'reports', entityId: 'financial', description: 'خروجی گزارش مالی (Excel)', ipAddress: '172.16.0.20', userAgent: 'Edge 119', severity: 'info', createdAt: '۱۴۰۳/۰۴/۱۵ ۱۰:۳۰' },
  { id: '5', userId: '1', userName: 'علی محمدی', userRole: 'admin', action: 'role_change', entity: 'user', entityId: 'U-789', description: 'تغییر نقش کاربر احمدی', ipAddress: '192.168.1.1', userAgent: 'Chrome 120', severity: 'warning', metadata: { userId: 'U-789', oldRole: 'support', newRole: 'operator' }, createdAt: '۱۴۰۳/۰۴/۱۴ ۱۶:۴۵' },
  { id: '6', userId: '6', userName: 'زهرا نوری', userRole: 'operator', action: 'login', entity: 'auth', entityId: 'session', description: 'ورود به سیستم', ipAddress: '185.1.2.3', userAgent: 'Mobile Safari', severity: 'info', createdAt: '۱۴۰۳/۰۴/۱۴ ۱۵:۲۰' },
  { id: '7', userId: '1', userName: 'علی محمدی', userRole: 'admin', action: 'ban', entity: 'user', entityId: 'U-456', description: 'مسدود کردن حساب کاربری', ipAddress: '192.168.1.1', userAgent: 'Chrome 120', severity: 'critical', metadata: { reason: 'تخلف مکرر' }, createdAt: '۱۴۰۳/۰۴/۱۴ ۱۴:۰۰' },
  { id: '8', userId: '2', userName: 'مریم احمدی', userRole: 'operator', action: 'create', entity: 'booking', entityId: 'B-9876', description: 'ایجاد رزرو دستی', ipAddress: '10.0.0.5', userAgent: 'Firefox 118', severity: 'info', createdAt: '۱۴۰۳/۰۴/۱۴ ۱۱:۱۵' },
  { id: '9', userId: '1', userName: 'علی محمدی', userRole: 'admin', action: 'setting_change', entity: 'settings', entityId: 'security', description: 'تغییر تنظیمات امنیتی: 2FA اجباری شد', ipAddress: '192.168.1.1', userAgent: 'Chrome 120', severity: 'critical', createdAt: '۱۴۰۳/۰۴/۱۳ ۱۸:۳۰' },
  { id: '10', userId: '4', userName: 'فاطمه حسینی', userRole: 'support', action: 'update', entity: 'ticket', entityId: 'T-321', description: 'پاسخ به تیکت و بستن آن', ipAddress: '10.0.1.8', userAgent: 'Chrome 120', severity: 'info', createdAt: '۱۴۰۳/۰۴/۱۳ ۱۶:۰۰' },
];

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'ایجاد',
  update: 'ویرایش',
  delete: 'حذف',
  login: 'ورود',
  logout: 'خروج',
  export: 'خروجی',
  setting_change: 'تغییر تنظیمات',
  role_change: 'تغییر نقش',
  ban: 'مسدودسازی',
};

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'text-green-400 bg-green-500/10',
  update: 'text-blue-400 bg-blue-500/10',
  delete: 'text-red-400 bg-red-500/10',
  login: 'text-slate-400 bg-slate-500/10',
  logout: 'text-slate-400 bg-slate-500/10',
  export: 'text-purple-400 bg-purple-500/10',
  setting_change: 'text-amber-400 bg-amber-500/10',
  role_change: 'text-orange-400 bg-orange-500/10',
  ban: 'text-red-400 bg-red-500/10',
};

const SEVERITY_CONFIG: Record<AuditSeverity, { icon: any; color: string; label: string }> = {
  info: { icon: FiInfo, color: 'text-blue-400', label: 'اطلاعاتی' },
  warning: { icon: FiAlertTriangle, color: 'text-amber-400', label: 'هشدار' },
  critical: { icon: FiAlertTriangle, color: 'text-red-400', label: 'بحرانی' },
};

export default function AuditPage() {
  const [logs] = useState<AuditLog[]>(MOCK_AUDIT);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = logs.filter(l => {
    const matchSearch = l.description.includes(search) || l.userName.includes(search) || l.ipAddress.includes(search);
    const matchAction = !filterAction || l.action === filterAction;
    const matchSeverity = !filterSeverity || l.severity === filterSeverity;
    const matchUser = !filterUser || l.userId === filterUser;
    return matchSearch && matchAction && matchSeverity && matchUser;
  });

  const uniqueUsers = Array.from(new Set(logs.map(l => ({ id: l.userId, name: l.userName })).map(u => JSON.stringify(u)))).map(u => JSON.parse(u));

  const severityCounts = {
    info: logs.filter(l => l.severity === 'info').length,
    warning: logs.filter(l => l.severity === 'warning').length,
    critical: logs.filter(l => l.severity === 'critical').length,
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="لاگ ممیزی"
        subtitle="سابقه تمام اقدامات ادمین‌ها و تغییرات سیستم"
        icon={<FiActivity />}
        action={
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
            <FiDownload className="w-4 h-4" />
            خروجی CSV
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['info', 'warning', 'critical'] as AuditSeverity[]).map(sev => {
          const conf = SEVERITY_CONFIG[sev];
          const Icon = conf.icon;
          return (
            <div key={sev} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sev === 'info' ? 'bg-blue-500/10' : sev === 'warning' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                  <Icon className={`w-5 h-5 ${conf.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${conf.color}`}>{severityCounts[sev]}</p>
                  <p className="text-slate-400 text-sm">{conf.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-wrap gap-3 items-center">
        <FiFilter className="text-slate-400 w-4 h-4" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجو در توضیحات، IP..."
          className="input-field flex-1 min-w-48"
        />
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="input-field">
          <option value="">همه اقدامات</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="input-field">
          <option value="">همه سطوح</option>
          <option value="info">اطلاعاتی</option>
          <option value="warning">هشدار</option>
          <option value="critical">بحرانی</option>
        </select>
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="input-field">
          <option value="">همه کاربران</option>
          {uniqueUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {(search || filterAction || filterSeverity || filterUser) && (
          <button
            onClick={() => { setSearch(''); setFilterAction(''); setFilterSeverity(''); setFilterUser(''); }}
            className="px-3 py-2 text-sm text-slate-400 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
          >
            پاک کردن
          </button>
        )}
      </div>

      {/* Logs List */}
      <div className="space-y-2">
        {filtered.map(log => {
          const sevConf = SEVERITY_CONFIG[log.severity];
          const SevIcon = sevConf.icon;
          const isExpanded = expandedId === log.id;

          return (
            <div
              key={log.id}
              className={`bg-slate-800 rounded-xl border transition-all cursor-pointer ${log.severity === 'critical' ? 'border-red-500/30' : log.severity === 'warning' ? 'border-amber-500/20' : 'border-slate-700'}`}
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
            >
              <div className="flex items-center gap-4 p-4">
                <SevIcon className={`w-4 h-4 ${sevConf.color} flex-shrink-0`} />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action]}`}>
                  {ACTION_LABELS[log.action]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{log.description}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {log.userName} ({log.userRole}) · {log.entity}/{log.entityId} · {log.ipAddress}
                  </p>
                </div>
                <span className="text-slate-500 text-xs whitespace-nowrap">{log.createdAt}</span>
              </div>

              {isExpanded && log.metadata && (
                <div className="px-4 pb-4 border-t border-slate-700 pt-3">
                  <p className="text-slate-400 text-xs mb-2">جزئیات متادیتا:</p>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300">
                    {Object.entries(log.metadata).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-slate-500">{k}:</span>
                        <span className="text-green-400">{JSON.stringify(v)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-slate-500">
                    <span>User-Agent: {log.userAgent}</span>
                    <span>IP: {log.ipAddress}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FiActivity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">هیچ لاگی یافت نشد</p>
        </div>
      )}

      <p className="text-slate-500 text-sm text-center">نمایش {filtered.length} از {logs.length} رکورد</p>
    </div>
  );
}
