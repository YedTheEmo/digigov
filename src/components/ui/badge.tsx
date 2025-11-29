import * as React from 'react';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'pending' | 'completed' | 'cancelled';
type BadgeStyle = 'solid' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  badgeStyle?: BadgeStyle;
  size?: Size;
  dot?: boolean;
  children: React.ReactNode;
}

const variantSolidClass: Record<Variant, string> = {
  default: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]',
  primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]',
  success: 'bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)] border border-[var(--color-warning)]',
  error: 'bg-[var(--color-error-light)] text-[var(--color-error)] border border-[var(--color-error)]',
  info: 'bg-[var(--color-info-light)] text-[var(--color-info)] border border-[var(--color-info)]',
  pending: 'bg-[var(--color-warning-light)] text-[var(--color-warning)] border border-[var(--color-warning)]',
  completed: 'bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success)]',
  cancelled: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-secondary)]',
};

const variantOutlineClass: Record<Variant, string> = {
  default: 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)]',
  primary: 'border-[var(--color-primary)] text-[var(--color-primary)]',
  success: 'border-[var(--color-success)] text-[var(--color-success)]',
  warning: 'border-[var(--color-warning)] text-[var(--color-warning)]',
  error: 'border-[var(--color-error)] text-[var(--color-error)]',
  info: 'border-[var(--color-info)] text-[var(--color-info)]',
  pending: 'border-[var(--color-warning)] text-[var(--color-warning)]',
  completed: 'border-[var(--color-success)] text-[var(--color-success)]',
  cancelled: 'border-[var(--color-border-secondary)] text-[var(--color-text-tertiary)]',
};

const dotColorClass: Record<Variant, string> = {
  default: 'bg-[var(--color-text-tertiary)]',
  primary: 'bg-[var(--color-primary)]',
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  error: 'bg-[var(--color-error)]',
  info: 'bg-[var(--color-info)]',
  pending: 'bg-[var(--color-warning)]',
  completed: 'bg-[var(--color-success)]',
  cancelled: 'bg-[var(--color-text-tertiary)]',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-3.5 py-2 text-base',
};

export function Badge({
  variant = 'default',
  badgeStyle = 'solid',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const styleClass = badgeStyle === 'solid' ? variantSolidClass[variant] : `border ${variantOutlineClass[variant]} bg-transparent`;
  
  return (
    <span
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${styleClass} ${sizeClass[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass[variant]}`} />}
      {children}
    </span>
  );
}
