import React from 'react';

export type CardVariant = 'dark-card' | 'glass-card' | 'flat';

export interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses: Record<CardVariant, string> = {
  'dark-card':
    'bg-gradient-to-b from-[rgba(20,5,5,0.9)] to-[rgba(10,0,0,0.95)] border border-[rgba(127,29,29,0.4)]',
  'glass-card':
    'bg-[rgba(10,0,0,0.6)] backdrop-blur-md border border-[rgba(127,29,29,0.3)]',
  flat:
    'bg-[#1a0505]/40 border border-[rgba(127,29,29,0.2)]',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

/**
 * Card Component — Shadow Realm Theme
 * variants: dark-card, glass-card, flat
 */
export const Card: React.FC<CardProps> = ({
  variant = 'dark-card',
  children,
  className = '',
  onClick,
  hover = false,
  padding = 'md',
}) => {
  const hoverClass = hover
    ? 'hover:border-primary/60 hover:shadow-blood transition-all duration-300 cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-xl shadow-dark ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
