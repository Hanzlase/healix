import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'neutral',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border tracking-wide select-none';

  const variants = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/60',
    error: 'bg-red-50 text-red-800 border-red-200/60',
    info: 'bg-brand-50/80 text-brand-700 border-brand-200/50',
    neutral: 'bg-surface-100 text-surface-700 border-surface-200/60',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
