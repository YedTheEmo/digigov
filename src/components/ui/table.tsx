import * as React from 'react';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
  striped?: boolean;
}

export function Table({ children, className = '', striped = false }: TableProps) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className={`w-full text-base ${striped ? 'table-striped' : ''} ${className}`}>{children}</table>
    </div>
  );
}

export function THead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <thead className={`bg-[var(--color-bg-tertiary)] ${className}`}>{children}</thead>;
}

export function TBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tbody className={`divide-y divide-[var(--color-border-primary)] ${className}`}>{children}</tbody>;
}

export interface TRProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function TR({ children, className = '', hover = true, onClick }: TRProps) {
  return (
    <tr
      className={`transition-colors ${hover ? 'hover:bg-[var(--color-bg-hover)]' : ''} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export interface THProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  onSort?: () => void;
}

export function TH({ children, className = '', sortable = false, onSort }: THProps) {
  return (
    <th
      className={`px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider ${
        sortable ? 'cursor-pointer select-none hover:bg-[var(--color-bg-hover)]' : ''
      } ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && <span className="text-[var(--color-text-tertiary)]">⇅</span>}
      </div>
    </th>
  );
}

export function TD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-4 text-[var(--color-text-primary)] ${className}`}>{children}</td>;
}

/* Add striped styling */
export const tableStyles = `
  .table-striped tbody tr:nth-child(odd) {
    background-color: rgba(0, 0, 0, 0.02);
  }
  .dark .table-striped tbody tr:nth-child(odd) {
    background-color: rgba(255, 255, 255, 0.02);
  }
`;
