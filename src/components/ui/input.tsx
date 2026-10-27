import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[#4B4F47]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full px-3 py-2 bg-white border rounded-md text-sm text-[#20221F] placeholder:text-[#A8ABA2] transition-subtle focus:outline-none focus:border-[#D65A31] focus:ring-2 focus:ring-[#D65A31]/15 disabled:bg-[#ECEDE7] disabled:text-[#A8ABA2] disabled:cursor-not-allowed ${
            error
              ? 'border-[#ECC3BE] focus:border-[#B83D38] focus:ring-[#B83D38]/15 bg-[#F8E9E6]/30'
              : 'border-[#DDDFD7]'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-[#B83D38] font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-[#696D65]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
