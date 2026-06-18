'use client';
/**
 * TIK TAK RUN — Shared UI Components
 * کامپوننت‌های مشترک رابط کاربری
 */

import React, { Fragment, ReactNode } from 'react';
import { X, AlertTriangle, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/utils/format';

// ==================== Loading ====================
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className={`${sizes[size]} text-red-500 animate-spin`} />
    </div>
  );
}

// ==================== StatusBadge ====================
// Accepts both STATUS_COLORS keys (PENDING, CONFIRMED...) and CSS-style keys (success, danger, warning, default, info)
// Optional `label` prop overrides the STATUS_LABELS lookup
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const colorClass = STATUS_COLORS[status] || 'bg-slate-500/20 text-slate-400';
  const displayLabel = label ?? (STATUS_LABELS[status] || status);
  return (
    <span className={`badge ${colorClass}`}>
      {displayLabel}
    </span>
  );
}

// ==================== Modal ====================
interface ModalProps {
  open?: boolean;
  isOpen?: boolean; // alias — same as `open`
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: ReactNode;
}

export function Modal({ open, isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  const visible = open ?? isOpen ?? false;
  if (!visible) return null;
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col fade-in`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="p-5 border-t border-slate-700 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Confirm Dialog ====================
interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;      // alias — same as `open`
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode; // primary prop — accepts string OR JSX
  message?: ReactNode;     // alias for `description`
  confirmLabel?: string;
  confirmText?: string;    // alias for `confirmLabel`
  variant?: 'danger' | 'warning' | 'info';
  type?: 'danger' | 'warning' | 'info'; // alias for `variant`
  loading?: boolean;
}

export function ConfirmDialog({
  open, isOpen,
  onClose, onConfirm,
  title,
  description, message,
  confirmLabel, confirmText,
  variant, type,
  loading,
}: ConfirmDialogProps) {
  const visible = open ?? isOpen ?? false;

  // resolve aliases
  const resolvedDescription = description ?? message;
  const resolvedConfirmLabel = confirmLabel ?? confirmText ?? 'تأیید';
  const resolvedVariant = variant ?? type ?? 'danger';

  const colors = {
    danger: { icon: 'text-red-400', bg: 'bg-red-500/10', btn: 'bg-red-600 hover:bg-red-700' },
    warning: { icon: 'text-yellow-400', bg: 'bg-yellow-500/10', btn: 'bg-yellow-600 hover:bg-yellow-700' },
    info: { icon: 'text-blue-400', bg: 'bg-blue-500/10', btn: 'bg-blue-600 hover:bg-blue-700' },
  };
  const c = colors[resolvedVariant];

  return (
    <Modal open={visible} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${c.btn} text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {resolvedConfirmLabel}
          </button>
        </>
      }
    >
      <div className={`${c.bg} rounded-xl p-4 flex gap-3`}>
        <AlertTriangle className={`${c.icon} w-6 h-6 flex-shrink-0 mt-0.5`} />
        <div className="text-slate-300 text-sm leading-relaxed">{resolvedDescription}</div>
      </div>
    </Modal>
  );
}

// ==================== Drawer ====================
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: 'right' | 'left';
  width?: string;
}

export function Drawer({ open, onClose, title, children, side = 'right', width = 'w-96' }: DrawerProps) {
  if (!open) return null;
  const position = side === 'right' ? 'right-0' : 'left-0';
  const translate = open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`absolute ${position} top-0 bottom-0 ${width} bg-slate-800 border-r border-slate-700 shadow-2xl transition-transform duration-300 ${translate} flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-white font-bold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ==================== Stats Card ====================
interface StatsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  color?: 'red' | 'green' | 'blue' | 'yellow' | 'purple';
  trend?: number;
}

export function StatsCard({ label, value, subValue, icon, color = 'red', trend }: StatsCardProps) {
  const colors = {
    red: { bg: 'from-red-500/10 to-transparent', icon: 'bg-red-500/20 text-red-400', border: 'border-red-500/20' },
    green: { bg: 'from-green-500/10 to-transparent', icon: 'bg-green-500/20 text-green-400', border: 'border-green-500/20' },
    blue: { bg: 'from-blue-500/10 to-transparent', icon: 'bg-blue-500/20 text-blue-400', border: 'border-blue-500/20' },
    yellow: { bg: 'from-yellow-500/10 to-transparent', icon: 'bg-yellow-500/20 text-yellow-400', border: 'border-yellow-500/20' },
    purple: { bg: 'from-purple-500/10 to-transparent', icon: 'bg-purple-500/20 text-purple-400', border: 'border-purple-500/20' },
  };
  const c = colors[color];

  return (
    <div className={`stat-card bg-gradient-to-br ${c.bg} border ${c.border} relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm mb-2">{label}</p>
          <p className="text-white text-2xl font-black">{value}</p>
          {subValue && <p className="text-slate-500 text-xs mt-1">{subValue}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
              <span className="text-slate-600">نسبت به ماه قبل</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${c.icon} p-3 rounded-xl`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Pagination ====================
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, total }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (i < 3) return i + 1;
    if (i === 3) return currentPage;
    return totalPages - (6 - i);
  }).filter((p, i, arr) => arr.indexOf(p) === i);

  return (
    <div className="flex items-center justify-between mt-4">
      {total !== undefined && (
        <p className="text-slate-500 text-sm">مجموع {total.toLocaleString('fa-IR')} آیتم</p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {pages.map((page, i) => (
          <Fragment key={i}>
            {i > 0 && pages[i] - pages[i - 1] > 1 && (
              <span className="text-slate-600 px-1">...</span>
            )}
            <button
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                currentPage === page
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {page}
            </button>
          </Fragment>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ==================== Empty State ====================
export function EmptyState({ title, description, action }: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      {description && <p className="text-slate-500 text-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ==================== Toggle Switch ====================
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-red-600' : 'bg-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'right-1' : 'right-6'
          }`}
        />
      </div>
      {label && <span className="text-slate-300 text-sm">{label}</span>}
    </label>
  );
}

// ==================== Avatar ====================
export function Avatar({ name, src, size = 'md' }: { name?: string; src?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizes[size]} bg-red-600/80 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {name?.charAt(0) || '?'}
    </div>
  );
}

// ==================== Table Wrapper ====================
export function Table({ headers, children, loading }: {
  headers: string[];
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="text-center py-8">
                <LoadingSpinner size="md" />
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

// ==================== Filter Bar ====================
export function FilterBar({ children, onReset }: { children: ReactNode; onReset?: () => void }) {
  return (
    <div className="admin-card mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {children}
        {onReset && (
          <button onClick={onReset} className="btn-ghost text-sm mr-auto">
            پاک کردن فیلترها
          </button>
        )}
      </div>
    </div>
  );
}

// ==================== Section Header ====================
// Accepts both `actions` (plural, original) and `action` (singular, alias)
// Also accepts optional `icon` prop displayed next to the title
export function SectionHeader({
  title,
  subtitle,
  actions,
  action,  // alias for `actions`
  icon,    // optional icon before title
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  action?: ReactNode;  // alias for `actions`
  icon?: ReactNode;    // decorative icon next to title
  breadcrumb?: { label: string; href?: string }[];
}) {
  const resolvedActions = actions ?? action;

  return (
    <div className="mb-6">
      {breadcrumb && (
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          {breadcrumb.map((item, i) => (
            <Fragment key={i}>
              {i > 0 && <ChevronLeft className="w-3 h-3" />}
              {item.href ? (
                <a href={item.href} className="hover:text-slate-300">{item.label}</a>
              ) : (
                <span className="text-slate-400">{item.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-red-500/20 rounded-xl text-red-400 flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-white">{title}</h1>
            {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
          </div>
        </div>
        {resolvedActions && <div className="flex items-center gap-2 flex-shrink-0">{resolvedActions}</div>}
      </div>
    </div>
  );
}
