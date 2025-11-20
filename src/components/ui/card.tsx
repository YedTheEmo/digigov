import * as React from 'react';

export interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ className = '', children, hover = false, onClick }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-[#242830] border border-gray-200 dark:border-[#2d3139] rounded-lg shadow-sm transition-all duration-200 ${
        hover ? 'hover:shadow-md' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-8 py-7 border-b border-gray-100 dark:border-[#2d3139] ${className}`}>{children}</div>;
}

export function CardTitle({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={`text-xl font-semibold text-gray-900 dark:text-gray-100 leading-7 ${className}`}>{children}</h3>;
}

export function CardDescription({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <p className={`text-base text-gray-600 dark:text-gray-400 mt-2 leading-relaxed ${className}`}>{children}</p>;
}

export function CardContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-8 py-7 ${className}`}>{children}</div>;
}

export function CardFooter({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-8 py-7 border-t border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>;
}
