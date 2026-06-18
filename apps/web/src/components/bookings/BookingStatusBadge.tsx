'use client';
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'در انتظار', color: '#f59e0b', bg: '#451a03' },
  CONFIRMED: { label: 'تأیید شده', color: '#22d3ee', bg: '#0a2133' },
  COMPLETED: { label: 'انجام شده', color: '#10b981', bg: '#052e16' },
  CANCELLED: { label: 'لغو شده', color: '#6b7280', bg: '#1f2937' },
};
export default function BookingStatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.PENDING;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-vazir" style={{ color: s.color, background: s.bg + '80', border: `1px solid ${s.color}30` }}>{s.label}</span>;
}
