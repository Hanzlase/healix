import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'terminal';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-medium rounded-md border tracking-tight select-none gap-1';

  const variants = {
    brand: 'bg-[#FBEFEA] text-[#D65A31] border-[#F1CCBE]',
    success: 'bg-[#E8F2EA] text-[#26764F] border-[#C3DEC8]',
    warning: 'bg-[#F6EFDF] text-[#94631A] border-[#E7D8BA]',
    danger: 'bg-[#F8E9E6] text-[#B83D38] border-[#ECC3BE]',
    neutral: 'bg-[#ECEDE7] text-[#4B4F47] border-[#DDDFD7]',
    terminal: 'bg-[#222522] text-[#A0A49B] border-[#353934]',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
