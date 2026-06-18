import React from 'react';

export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const colorMap = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  accent: 'bg-accent',
};

const heightMap = { sm: 'h-1.5', md: 'h-3', lg: 'h-5' };

/**
 * ProgressBar Component — Shadow Realm Theme
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  color = 'primary',
  size = 'md',
  animate = false,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showValue && <span className="text-xs text-text-muted">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full ${heightMap[size]} bg-[rgba(127,29,29,0.2)] rounded-full overflow-hidden`}>
        <div
          className={`${heightMap[size]} ${colorMap[color]} rounded-full transition-all duration-700 ${animate ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
