"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Cases', href: '/cases' },
  { label: 'Procurement', href: '/procurement' },
  { label: 'Supply', href: '/supply' },
  { label: 'Budget', href: '/budget' },
  { label: 'Accounting', href: '/accounting' },
  { label: 'Cashier', href: '/cashier' },
  { label: 'Activity Logs', href: '/logs' },
  { label: 'Admin', href: '/admin' },
];

const roleNavVisibility: Record<string, string[]> = {
  PROCUREMENT_MANAGER: ['/cases', '/procurement', '/logs'],
  BAC_SECRETARIAT: ['/cases', '/procurement', '/logs'],
  TWG_MEMBER: ['/cases', '/procurement', '/logs'],
  SUPPLY_MANAGER: ['/cases', '/supply', '/logs'],
  BUDGET_MANAGER: ['/cases', '/budget', '/logs'],
  ACCOUNTING_MANAGER: ['/cases', '/accounting', '/logs'],
  CASHIER_MANAGER: ['/cases', '/cashier', '/logs'],
};

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visibleNavItems = useMemo(() => {
    if (!role || role === 'ADMIN') {
      return navItems;
    }
    const allowed = roleNavVisibility[role];
    if (!allowed) return navItems;
    return navItems.filter((item) => allowed.includes(item.href));
  }, [role]);

  return (
    <aside
      className={`flex-shrink-0 h-full bg-[#1a1d23] border-r border-[#2d3139] transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#2d3139] flex-shrink-0">
        {!collapsed && (
          <Link href="/procurement" className="text-xl font-bold tracking-tight text-gray-100">
            DigiGov
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-[#242830] transition-colors flex-shrink-0 ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
            />
          </svg>
        </button>
      </div>

      <nav className="px-4 py-6 overflow-y-auto" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="space-y-1.5">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const initial = item.label.charAt(0);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium transition-all relative ${
                  isActive
                    ? 'bg-green-900/10 text-green-400 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-green-500 before:rounded-r'
                    : 'text-gray-300 hover:bg-[#242830]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {collapsed ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#242830] text-sm font-semibold text-gray-100 mx-auto">
                    {initial}
                  </span>
                ) : (
                  <span className="truncate flex-1">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
