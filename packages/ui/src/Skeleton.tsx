import React from 'react';

export interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: boolean | 'full';
  lines?: number;
  className?: string;
}

/**
 * Skeleton Loading Component — Shadow Realm Theme
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  rounded = false,
  lines,
  className = '',
}) => {
  const baseClass =
    'bg-gradient-to-r from-[rgba(127,29,29,0.15)] via-[rgba(127,29,29,0.3)] to-[rgba(127,29,29,0.15)] bg-[length:200%_100%] animate-pulse';
  const roundedClass = rounded === 'full' ? 'rounded-full' : rounded ? 'rounded-lg' : 'rounded';

  if (lines) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} ${roundedClass}`}
            style={{ width: i === lines - 1 ? '70%' : '100%', height }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} ${roundedClass} ${className}`}
      style={{ width, height }}
    />
  );
};
