import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, leftIcon, rightIcon, fullWidth = true, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hasError = !!error;
    const { placeholder, ...restProps } = props;

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="block text-base font-medium text-[var(--color-text-primary)] mb-4">
            {label}
            {props.required && <span className="text-[var(--color-danger)] ml-1" aria-label="required">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full border rounded-lg px-4 py-3.5 text-base min-h-[48px] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed ${
              hasError
                ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20'
                : 'border-[var(--color-border-primary)]'
            } ${leftIcon ? 'pl-12' : ''} ${rightIcon ? 'pr-12' : ''} ${props.type === 'datetime-local' || props.type === 'date' || props.type === 'time' ? 'pr-3' : ''} ${className}`}
            placeholder={placeholder}
            aria-invalid={hasError}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...restProps}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-2 text-base text-[var(--color-danger)]">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-2 text-base text-[var(--color-text-secondary)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
