import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'terminal';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D65A31]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const variants = {
      primary:
        'bg-[#D65A31] text-white hover:bg-[#B94A28] active:bg-[#A23E1E] border border-[#B94A28]/40 shadow-xs',
      secondary:
        'bg-[#ECEDE7] text-[#20221F] hover:bg-[#E2E4DC] active:bg-[#D5D7CD] border border-[#DDDFD7]',
      outline:
        'bg-[#FFFFFF] text-[#20221F] border border-[#DDDFD7] hover:bg-[#F5F4EF] hover:border-[#C4C7BE] active:bg-[#ECEDE7] shadow-2xs',
      danger:
        'bg-[#B83D38] text-white hover:bg-[#A33530] active:bg-[#8E2D29] border border-[#8E2D29]/40 shadow-xs',
      ghost:
        'text-[#696D65] hover:text-[#20221F] hover:bg-[#ECEDE7] active:bg-[#E2E4DC]',
      terminal:
        'bg-[#222522] text-[#E8E9E3] hover:bg-[#2D312D] active:bg-[#191B19] border border-[#353934]',
    };

    const sizes = {
      xs: 'px-2 py-1 text-xs gap-1.5 h-7',
      sm: 'px-2.5 py-1.5 text-xs gap-1.5 h-8',
      md: 'px-3.5 py-2 text-sm gap-2 h-9',
      lg: 'px-4 py-2.5 text-sm gap-2.5 h-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
