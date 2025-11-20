import * as React from 'react';
import { Spinner } from './spinner';

type Variant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  default: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 shadow-sm active:shadow-inner',
  primary: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 shadow-sm active:shadow-inner',
  secondary: 'bg-gray-100 dark:bg-[#242830] text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-[#2a2e38] border border-gray-300 dark:border-[#3a3f4a]',
  outline: 'border-2 border-gray-300 dark:border-[#3a3f4a] bg-transparent hover:border-green-600 hover:text-green-600 dark:hover:border-green-500 dark:hover:text-green-400 text-gray-700 dark:text-gray-300',
  ghost: 'bg-transparent hover:bg-gray-50 dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300',
  destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 shadow-sm active:shadow-inner',
  link: 'bg-transparent text-green-600 dark:text-green-400 hover:underline p-0 h-auto',
};

const sizeClass: Record<Size, string> = {
  sm: 'min-h-[48px] px-4 py-3 text-base',
  md: 'min-h-[52px] px-6 py-3.5 text-base',
  lg: 'min-h-[56px] px-8 py-4 text-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', loading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variantClass[variant]} ${variant !== 'link' ? sizeClass[size] : ''} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';
