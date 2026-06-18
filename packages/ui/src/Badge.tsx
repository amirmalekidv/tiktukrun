import React from 'react';

export type BadgeVariant = 'blood' | 'success' | 'warning' | 'info' | 'ghost' | 'accent' | 'muted';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  blood: 'bg-red-900/50 text-red-300 border border-red-800/50',
  success: 'bg-green-900/50 text-green-300 border border-green-800/50',
  warning: 'bg-amber-900/50 text-amber-300 border border-amber-800/50',
  info: 'bg-blue-900/50 text-blue-300 border border-blue-800/50',
  ghost: 'bg-transparent text-text-secondary border border-[rgba(127,29,29,0.3)]',
  accent: 'bg-amber-400/20 text-amber-300 border border-amber-600/50',
  muted: 'bg-neutral-800/50 text-neutral-400 border border-neutral-700/50',
};

/**
 * Badge Component — Shadow Realm Theme
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'ghost',
  children,
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const base = 'inline-flex items-center gap-1.5 rounded-full font-medium';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`${base} ${sizeClass} ${variantClasses[variant]} ${className}`}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
};
