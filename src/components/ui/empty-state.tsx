import * as React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-16 text-center ${className}`}>
      {icon && <div className="mb-6 text-6xl opacity-50">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h3>
      {description && <p className="text-base text-gray-600 dark:text-gray-400 mb-8 max-w-lg leading-relaxed">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

