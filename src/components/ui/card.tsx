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
      className={`bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-[var(--radius-lg)] shadow-sm transition-all duration-200 ${
        hover ? 'hover:shadow-md' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-8 py-7 border-b border-[var(--color-border-primary)] ${className}`}>{children}</div>;
}

export function CardTitle({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={`text-xl font-semibold text-[var(--color-text-primary)] leading-7 ${className}`}>{children}</h3>;
}

export function CardDescription({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <p className={`text-base text-[var(--color-text-secondary)] mt-2 leading-relaxed ${className}`}>{children}</p>;
}

export function CardContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-8 py-7 ${className}`}>{children}</div>;
}

export function CardFooter({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-8 py-7 border-t border-[var(--color-border-primary)] ${className}`}>{children}</div>;
}
