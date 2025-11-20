"use client";

import { useEffect, useRef, useState } from 'react';

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'end', className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (open && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center gap-2 bg-transparent border-none hover:opacity-80 transition-opacity p-0"
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`absolute ${
            align === 'end' ? 'right-0' : 'left-0'
          } mt-2 min-w-[12rem] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50 animate-slide-down`}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</div>}
    </div>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-gray-200 dark:border-gray-700" />;
}

export interface DropdownItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

export function DropdownItem({ onClick, children, icon, destructive = false, disabled = false }: DropdownItemProps) {
  return (
    <button
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
        destructive
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      role="menuitem"
      disabled={disabled}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
