import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'accent' | 'white';
  label?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
const colorMap = { primary: 'border-primary', accent: 'border-accent', white: 'border-white' };

/**
 * Spinner Component — Shadow Realm Theme
 */
export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'primary', label }) => (
  <div className="flex flex-col items-center gap-3" role="status">
    <div
      className={`${sizeMap[size]} ${colorMap[color]} border-4 border-t-transparent rounded-full animate-spin`}
    />
    {label && <span className="text-sm text-text-secondary">{label}</span>}
    <span className="sr-only">در حال بارگذاری...</span>
  </div>
);
