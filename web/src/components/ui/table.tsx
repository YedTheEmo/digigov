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
  return <thead className={`bg-gray-50 dark:bg-[#1a1d23] ${className}`}>{children}</thead>;
}

export function TBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tbody className={`divide-y divide-gray-100 dark:divide-[#2d3139] ${className}`}>{children}</tbody>;
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
      className={`transition-colors ${hover ? 'hover:bg-gray-50 dark:hover:bg-[#242830]' : ''} ${
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
      className={`px-8 py-5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider ${
        sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700' : ''
      } ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && <span className="text-gray-400">⇅</span>}
      </div>
    </th>
  );
}

export function TD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-8 py-5 text-gray-900 dark:text-gray-100 ${className}`}>{children}</td>;
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
