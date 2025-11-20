import * as React from 'react';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'pending' | 'completed' | 'cancelled';
type Style = 'solid' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: Variant;
  style?: Style;
  size?: Size;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantSolidClass: Record<Variant, string> = {
  default: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600',
  primary: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
  success: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
  warning: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  pending: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  completed: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
  cancelled: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600',
};

const variantOutlineClass: Record<Variant, string> = {
  default: 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300',
  primary: 'border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400',
  success: 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400',
  warning: 'border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400',
  error: 'border-red-300 dark:border-red-700 text-red-700 dark:text-red-400',
  info: 'border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400',
  pending: 'border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400',
  completed: 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400',
  cancelled: 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400',
};

const dotColorClass: Record<Variant, string> = {
  default: 'bg-gray-500',
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  pending: 'bg-yellow-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-500',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3.5 py-2 text-base',
  lg: 'px-4 py-2.5 text-base',
};

export function Badge({
  variant = 'default',
  style = 'solid',
  size = 'md',
  dot = false,
  className = '',
  children,
}: BadgeProps) {
  const styleClass = style === 'solid' ? variantSolidClass[variant] : `border ${variantOutlineClass[variant]} bg-transparent`;
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${styleClass} ${sizeClass[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass[variant]}`} />}
      {children}
    </span>
  );
}
