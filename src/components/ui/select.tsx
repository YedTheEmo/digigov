import * as React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, fullWidth = true, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const hasError = !!error;

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={selectId} className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-4">
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full border rounded-lg px-4 py-3.5 pr-12 text-base min-h-[48px] bg-white dark:bg-[#242830] text-gray-900 dark:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-[#1a1d23] disabled:cursor-not-allowed ${
            hasError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-[#3a3f4a]'
          } ${className}`}
          aria-invalid={hasError}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-2 text-base text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${selectId}-helper`} className="mt-2 text-base text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
