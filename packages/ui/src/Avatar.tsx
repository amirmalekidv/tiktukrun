import React from 'react';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name.slice(0, 2);
};

/**
 * Avatar Component — Shadow Realm Theme
 */
export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', online, className = '' }) => {
  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name || 'آواتار'}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-primary/40`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-blood-gradient border-2 border-primary/40 flex items-center justify-center text-white font-bold`}
        >
          {name ? getInitials(name) : '?'}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-background ${online ? 'bg-success' : 'bg-text-muted'}`}
        />
      )}
    </div>
  );
};
