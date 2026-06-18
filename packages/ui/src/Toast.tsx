import React from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  duration?: number;
}

const typeConfig: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: { bg: 'bg-green-900/80', icon: '✓', border: 'border-green-600' },
  error: { bg: 'bg-red-900/80', icon: '✗', border: 'border-red-600' },
  warning: { bg: 'bg-amber-900/80', icon: '⚠', border: 'border-amber-600' },
  info: { bg: 'bg-blue-900/80', icon: 'ℹ', border: 'border-blue-600' },
};

/**
 * Toast Component — Shadow Realm Theme
 * برای نمایش اعلان‌های کوتاه
 */
export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const config = typeConfig[type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bg} ${config.border} backdrop-blur-sm shadow-dark text-text-primary`}
      role="alert"
    >
      <span className="text-lg font-bold flex-shrink-0">{config.icon}</span>
      <span className="flex-1 text-sm">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
          ×
        </button>
      )}
    </div>
  );
};
