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
            className="block text-xs font-bold text-surface-700 uppercase tracking-wider"
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
          className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm transition-smooth placeholder:text-surface-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              : 'border-surface-200 focus:border-brand-500'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs font-semibold text-red-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-surface-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
