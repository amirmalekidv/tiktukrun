'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader, EmptyState, Pagination } from '@/components/ui';
import { FiActivity, FiFilter, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { RefreshCw } from 'lucide-react';
import { auditApi } from '@/lib/api';
import { toJalaliDateTime } from '@/lib/utils/format';
import toast from 'react-hot-toast';

// Backend AuditLog: { id, actorId, action, entity, entityId, beforeJson, afterJson, ip, ua, createdAt, actor:{id,fullName,mobile} }
interface AuditLog {
  id: string;
  actorId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  ip?: string | null;
  ua?: string | null;
  createdAt: string;
  actor?: { id: string; fullName?: string | null; mobile?: string | null } | null;
}

const PAGE_SIZE = 50;

type Severity = 'info' | 'warning' | 'critical';

function severityOf(action: string): Severity {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('ban') || a.includes('remove')) return 'critical';
  if (a.includes('update') || a.includes('change') || a.includes('role') || a.includes('setting')) return 'warning';
  return 'info';
}

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; label: string }> = {
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'اطلاعاتی' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'هشدار' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'بحرانی' },
};

// audit list returns { success, data:[...], total, meta } directly
function readList(res: { data?: unknown } | null | undefined): { items: AuditLog[]; total: number } {
  const body = (res as { data?: { data?: AuditLog[]; total?: number; meta?: { total?: number } } } | null | undefined)?.data;
  if (!body) return { items: [], total: 0 };
  const items = Array.isArray(body.data) ? body.data : [];
  const total = body.total ?? body.meta?.total ?? items.length;
  return { items, total };
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (filterAction) params.action = filterAction;
      const res = await auditApi.getAll(params);
      const { items, total: t } = readList(res);
      setLogs(items);
      setTotal(t);
    } catch {
      toast.error('خطا در بارگذاری لاگ‌ها');
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const hay = `${l.action} ${l.entity ?? ''} ${l.entityId ?? ''} ${l.ip ?? ''} ${l.actor?.fullName ?? ''} ${l.actor?.mobile ?? ''}`;
    return hay.includes(search);
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="لاگ ممیزی"
        subtitle="سابقه تمام اقدامات ادمین‌ها و تغییرات سیستم"
        icon={<FiActivity />}
      />

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-wrap gap-3 items-center">
        <FiFilter className="text-slate-400 w-4 h-4" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در اقدام، موجودیت، IP، کاربر..."
          className="input-field flex-1 min-w-48"
        />
        <input
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          placeholder="فیلتر اقدام (مثلا delete)"
          className="input-field"
        />
        {(search || filterAction) && (
          <button
            onClick={() => { setSearch(''); setFilterAction(''); setPage(1); }}
            className="px-3 py-2 text-sm text-slate-400 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
          >
            پاک کردن
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="هیچ لاگی یافت نشد" description="رکوردی برای نمایش وجود ندارد." />
      ) : (
        <>
          <div className="space-y-2">
            {filtered.map((log) => {
              const sev = severityOf(log.action);
              const conf = SEVERITY_CONFIG[sev];
              const SevIcon = sev === 'info' ? FiInfo : FiAlertTriangle;
              const isExpanded = expandedId === log.id;
              const hasDetails = log.beforeJson || log.afterJson;

              return (
                <div
                  key={log.id}
                  className={`bg-slate-800 rounded-xl border transition-all cursor-pointer ${sev === 'critical' ? 'border-red-500/30' : sev === 'warning' ? 'border-amber-500/20' : 'border-slate-700'}`}
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center gap-4 p-4">
                    <SevIcon className={`w-4 h-4 ${conf.color} flex-shrink-0`} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conf.color} ${conf.bg}`}>
                      {log.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">
                        {log.entity ?? '-'}{log.entityId ? `/${log.entityId}` : ''}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {log.actor?.fullName ?? log.actorId ?? 'سیستم'}
                        {log.actor?.mobile ? ` (${log.actor.mobile})` : ''}
                        {log.ip ? ` · ${log.ip}` : ''}
                      </p>
                    </div>
                    <span className="text-slate-500 text-xs whitespace-nowrap">{toJalaliDateTime(log.createdAt)}</span>
                  </div>

                  {isExpanded && hasDetails && (
                    <div className="px-4 pb-4 border-t border-slate-700 pt-3">
                      {log.beforeJson && (
                        <>
                          <p className="text-slate-400 text-xs mb-1">قبل:</p>
                          <pre className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-amber-400 overflow-x-auto mb-2">
                            {JSON.stringify(log.beforeJson, null, 2)}
                          </pre>
                        </>
                      )}
                      {log.afterJson && (
                        <>
                          <p className="text-slate-400 text-xs mb-1">بعد:</p>
                          <pre className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-green-400 overflow-x-auto">
                            {JSON.stringify(log.afterJson, null, 2)}
                          </pre>
                        </>
                      )}
                      {log.ua && (
                        <div className="mt-2 text-xs text-slate-500">User-Agent: {log.ua}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={total}
          />
        </>
      )}
    </div>
  );
}
