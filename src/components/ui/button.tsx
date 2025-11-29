import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Spinner } from './spinner';

type Variant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const variantClass: Record<Variant, string> = {
  default: 'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:opacity-90 shadow-sm active:shadow-inner',
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm active:shadow-inner',
  secondary: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-primary)]',
  outline: 'border-2 border-[var(--color-border-primary)] bg-transparent hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-[var(--color-text-secondary)]',
  ghost: 'bg-transparent hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  destructive: 'bg-[var(--color-error)] text-white hover:opacity-90 shadow-sm active:shadow-inner',
  link: 'bg-transparent text-[var(--color-primary)] hover:underline p-0 h-auto',
};

const sizeClass: Record<Size, string> = {
  sm: 'min-h-[48px] px-4 py-3 text-base',
  md: 'min-h-[52px] px-6 py-3.5 text-base',
  lg: 'min-h-[56px] px-8 py-4 text-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const Component = asChild ? Slot : 'button';
    
    return (
      <Component
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variantClass[variant]} ${variant !== 'link' ? sizeClass[size] : ''} ${className}`}
        {...(!asChild && { disabled: isDisabled })}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </Component>
    );
  }
);
Button.displayName = 'Button';
