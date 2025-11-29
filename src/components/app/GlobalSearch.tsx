"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type QuickItemType = 'page' | 'action';

interface QuickItem {
  id: string;
  type: QuickItemType;
  label: string;
  description?: string;
  href: string;
}

const quickItems: QuickItem[] = [
  {
    id: 'cases-all',
    type: 'page',
    label: 'Open cases workspace',
    description: 'View and manage all procurement cases.',
    href: '/cases',
  },
  {
    id: 'search-cases',
    type: 'action',
    label: 'Search cases by title or ID',
    description: 'Use the dedicated case search experience.',
    href: '/search',
  },
  {
    id: 'workspace-procurement',
    type: 'page',
    label: 'Procurement workspace',
    description: 'Overview of active procurement workflows.',
    href: '/procurement',
  },
  {
    id: 'workspace-supply',
    type: 'page',
    label: 'Supply workspace',
    description: 'Manage item catalogs and suppliers.',
    href: '/supply',
  },
  {
    id: 'workspace-budget',
    type: 'page',
    label: 'Budget workspace',
    description: 'Monitor budget utilization and approvals.',
    href: '/budget',
  },
  {
    id: 'workspace-accounting',
    type: 'page',
    label: 'Accounting workspace',
    description: 'Handle disbursements and journal entries.',
    href: '/accounting',
  },
  {
    id: 'workspace-cashier',
    type: 'page',
    label: 'Cashier workspace',
    description: 'Track collections and payments.',
    href: '/cashier',
  },
  {
    id: 'reports',
    type: 'page',
    label: 'Reports',
    description: 'Run workflow and budget reports.',
    href: '/reports',
  },
  {
    id: 'logs',
    type: 'page',
    label: 'Activity logs',
    description: 'Audit recent actions and system events.',
    href: '/logs',
  },
  {
    id: 'admin',
    type: 'page',
    label: 'Administration',
    description: 'Roles, permissions, and configuration.',
    href: '/admin',
  },
];

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quickItems;
    return quickItems.filter((item) => {
      const haystack = `${item.label} ${item.description ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  useEffect(() => {
    if (!filtered.length) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex > filtered.length - 1) {
      setActiveIndex(filtered.length - 1);
    }
  }, [filtered, activeIndex]);

  const handleNavigate = (item: QuickItem) => {
    onClose();
    router.push(item.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filtered.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = filtered[activeIndex];
      if (item) handleNavigate(item);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 pt-24 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#111318] border border-[#2d3139] shadow-2xl mx-4 animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d3139]">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder:text-gray-500 outline-none border-none"
            placeholder="Search DigiGov workspaces, reports, and actions…"
          />
          <span className="hidden md:inline-flex items-center gap-1 rounded-md border border-[#2d3139] px-2 py-0.5 text-[11px] text-gray-500">
            <span className="font-mono text-[10px]">Ctrl</span>+<span className="font-mono text-[10px]">K</span>
          </span>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-4 text-sm text-gray-500">No matches. Try a different term.</div>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item)}
                className={`w-full px-4 py-2.5 text-left text-sm flex flex-col gap-0.5 transition-colors ${
                  index === activeIndex ? 'bg-[#181b22] text-gray-100' : 'text-gray-300 hover:bg-[#181b22]'
                }`}
              >
                <span className="font-medium">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-gray-500">{item.description}</span>
                )}
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#2d3139] text-[11px] text-gray-500">
          <span>Program-wide search across DigiGov workspaces and utilities.</span>
          <span>Use case search in the Cases workspace for record-level results.</span>
        </div>
      </div>
    </div>
  );
}


