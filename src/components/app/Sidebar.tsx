"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, ReactNode, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Tooltip } from '@/components/ui/tooltip';
import { createPortal } from 'react-dom';

interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

interface NavGroup {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'cases',
    label: 'Cases',
    href: '/cases',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M4 7a2 2 0 012-2h3.5l1.5 2H18a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"
        />
      </svg>
    ),
    items: [
      { 
        label: 'Cases', 
        href: '/cases',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7a2 2 0 012-2h3.5l1.5 2H18a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
          </svg>
        )
      },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    href: '/procurement',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12h6M9 16h6M7 8h10M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"
        />
      </svg>
    ),
    items: [
      { 
        label: 'Procurement', 
        href: '/procurement',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6M9 16h6M7 8h10M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
          </svg>
        )
      },
      { 
        label: 'Supply', 
        href: '/supply',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    href: '/finance',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14h2m4 0h2" />
      </svg>
    ),
    items: [
      { 
        label: 'Finance', 
        href: '/finance',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14h2m4 0h2" />
          </svg>
        )
      },
      { 
        label: 'Budget', 
        href: '/budget',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      { 
        label: 'Accounting', 
        href: '/accounting',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      },
      { 
        label: 'Cashier', 
        href: '/cashier',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    href: '/insights',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M4 19h16M6 17V9m6 8V5m6 12v-7"
        />
      </svg>
    ),
    items: [
      { 
        label: 'Insights', 
        href: '/insights',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 19h16M6 17V9m6 8V5m6 12v-7" />
          </svg>
        )
      },
      { 
        label: 'Reports', 
        href: '/reports',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      },
      { 
        label: 'Activity Logs', 
        href: '/logs',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M19.4 15a1 1 0 01.2 1.1l-1 1.7a1 1 0 01-1 .5l-1.3-.3a5.5 5.5 0 01-1.2.7l-.3 1.3a1 1 0 01-1 .8h-2a1 1 0 01-1-.8l-.3-1.3a5.5 5.5 0 01-1.2-.7l-1.3.3a1 1 0 01-1-.5l-1-1.7a1 1 0 01.2-1.1l1.1-1a5.4 5.4 0 010-1.4l-1.1-1a1 1 0 01-.2-1.1l1-1.7a1 1 0 011-.5l1.3.3a5.5 5.5 0 011.2-.7l.3-1.3a1 1 0 011-.8h2a1 1 0 011 .8l.3 1.3a5.5 5.5 0 011.2.7l1.3-.3a1 1 0 011 .5l1 1.7a1 1 0 01-.2 1.1l-1.1 1a5.4 5.4 0 010 1.4z"
        />
      </svg>
    ),
    items: [{ 
      label: 'Administration', 
      href: '/admin',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.4 15a1 1 0 01.2 1.1l-1 1.7a1 1 0 01-1 .5l-1.3-.3a5.5 5.5 0 01-1.2.7l-.3 1.3a1 1 0 01-1 .8h-2a1 1 0 01-1-.8l-.3-1.3a5.5 5.5 0 01-1.2-.7l-1.3.3a1 1 0 01-1-.5l-1-1.7a1 1 0 01.2-1.1l1.1-1a5.4 5.4 0 010-1.4l-1.1-1a1 1 0 01-.2-1.1l1-1.7a1 1 0 011-.5l1.3.3a5.5 5.5 0 011.2-.7l.3-1.3a1 1 0 011-.8h2a1 1 0 011 .8l.3 1.3a5.5 5.5 0 011.2.7l1.3-.3a1 1 0 011 .5l1 1.7a1 1 0 01-.2 1.1l-1.1 1a5.4 5.4 0 010 1.4z" />
        </svg>
      )
    }],
  },
];

const roleNavVisibility: Record<string, string[]> = {
  PROCUREMENT_MANAGER: ['/cases', '/procurement', '/reports', '/logs', '/search'],
  BAC_SECRETARIAT: ['/cases', '/procurement', '/reports', '/logs', '/search'],
  TWG_MEMBER: ['/cases', '/procurement', '/logs', '/search'],
  SUPPLY_MANAGER: ['/cases', '/supply', '/logs', '/search'],
  BUDGET_MANAGER: ['/cases', '/budget', '/reports', '/logs', '/search'],
  ACCOUNTING_MANAGER: ['/cases', '/accounting', '/reports', '/logs', '/search'],
  CASHIER_MANAGER: ['/cases', '/cashier', '/logs', '/search'],
};

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { visualTheme, sidebarCollapsedByDefault, setSidebarCollapsedByDefault } = useTheme();
  const [pinnedOpen, setPinnedOpen] = useState<boolean>(!sidebarCollapsedByDefault);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Ensure component is mounted before rendering to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug log for openGroupId changes
  useEffect(() => {
    if (mounted) {
      setPinnedOpen(!sidebarCollapsedByDefault);
    }
  }, [sidebarCollapsedByDefault, mounted]);

  const isCollapsed = !pinnedOpen;

  const visibleGroups = useMemo(() => {
    const allowedHrefs =
      !role || role === 'ADMIN' ? null : roleNavVisibility[role] ?? null;

    const filterItems = (items: NavItem[]) =>
      !allowedHrefs ? items : items.filter((item) => allowedHrefs.includes(item.href));

    return navGroups
      .map((group) => ({
        ...group,
        items: filterItems(group.items),
      }))
      .filter((group) => group.items.length > 0);
  }, [role]);

  const handleTogglePinned = () => {
    const newPinnedState = !pinnedOpen;
    setPinnedOpen(newPinnedState);
    setSidebarCollapsedByDefault(!newPinnedState);
  };

  const isGroupActive = (group: NavGroup) => {
    const destinations = [
      group.href,
      ...group.items.map((item) => item.href),
    ].filter(Boolean) as string[];

    return destinations.some(
      (dest) => pathname === dest || pathname.startsWith(dest + '/'),
    );
  };

  const isModernTheme = visualTheme === 'modern-hub';

  const handleGroupMouseEnter = (groupId: string) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    // Calculate flyout position
    const button = buttonRefs.current.get(groupId);
    if (button) {
      const rect = button.getBoundingClientRect();
      setFlyoutPosition({
        top: rect.top,
        left: rect.right + 8, // 8px gap
      });
    }
    
    setOpenGroupId(groupId);
  };

  const handleGroupMouseLeave = () => {
    // Add a delay before closing to allow moving to the flyout menu
    const timeout = setTimeout(() => {
      setOpenGroupId(null);
    }, 300);
    setHoverTimeout(timeout);
  };

  const handleFlyoutMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleFlyoutMouseLeave = () => {
    const timeout = setTimeout(() => {
      setOpenGroupId(null);
    }, 150);
    setHoverTimeout(timeout);
  };

  return (
    <aside
      className={`flex-shrink-0 h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-primary)] transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      style={{ overflow: 'visible' }}
      suppressHydrationWarning
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-border-primary)] flex-shrink-0">
        {!isCollapsed && (
          <Link
            href="/cases"
            className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white">
              DG
            </span>
            <span className="truncate">DigiGov</span>
          </Link>
        )}
        <button
          onClick={handleTogglePinned}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors flex-shrink-0 ml-auto"
          aria-label={pinnedOpen ? 'Collapse sidebar' : 'Pin sidebar open'}
        >
          <svg className="w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={pinnedOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
            />
          </svg>
        </button>
      </div>

      <nav
        className="relative px-2 py-4"
        style={{ height: 'calc(100vh - 4rem)' }}
        aria-label="Main navigation"
      >
        <div className="space-y-2 overflow-y-auto overflow-x-visible" style={{ maxHeight: '100%' }}>
          {visibleGroups.map((group) => {
            const active = isGroupActive(group);
            const isOpen = openGroupId === group.id;
            const primaryItem = group.items[0];
            const groupDestination = group.href ?? primaryItem?.href;

            return (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => handleGroupMouseEnter(group.id)}
                onMouseLeave={handleGroupMouseLeave}
              >
                {isCollapsed ? (
                  <Tooltip content={group.label} position="right">
                    <button
                      ref={(el) => {
                        if (el) buttonRefs.current.set(group.id, el);
                      }}
                      type="button"
                      className={`group flex items-center justify-center w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-secondary)] ${
                        active
                          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                      }`}
                      aria-haspopup="menu"
                      aria-expanded={isOpen}
                      aria-label={group.label}
                      onClick={(e) => {
                        e.preventDefault();
                        if (groupDestination) {
                          router.push(groupDestination);
                        }
                      }}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          active
                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] group-hover:bg-[var(--color-bg-hover)]'
                        }`}
                      >
                        {group.icon}
                      </span>
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--color-primary)]" />
                      )}
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    ref={(el) => {
                      if (el) buttonRefs.current.set(group.id, el);
                    }}
                    type="button"
                    className={`group flex items-center justify-start w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-secondary)] ${
                      active
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-label={group.label}
                    onClick={(e) => {
                      e.preventDefault();
                      if (groupDestination) {
                        router.push(groupDestination);
                      }
                    }}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        active
                          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] group-hover:bg-[var(--color-bg-hover)]'
                      }`}
                    >
                      {group.icon}
                    </span>
                    <span className="ml-3 flex-1 text-left truncate">
                      {group.label}
                    </span>
                    <svg
                      className="ml-1 w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--color-primary)]" />
                    )}
                  </button>
                )}

              </div>
            );
          })}
        </div>
      </nav>
      
      {/* Flyout menu portal - render at body level */}
      {openGroupId && flyoutPosition && typeof window !== 'undefined' && createPortal(
        <div
          className={`fixed z-[9999] min-w-[200px] rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-xl overflow-hidden ${
            isModernTheme ? 'backdrop-blur-sm bg-opacity-95' : ''
          }`}
          role="menu"
          aria-label={visibleGroups.find(g => g.id === openGroupId)?.label}
          onMouseEnter={handleFlyoutMouseEnter}
          onMouseLeave={handleFlyoutMouseLeave}
          style={{
            top: `${flyoutPosition.top}px`,
            left: `${flyoutPosition.left}px`,
          }}
        >
          <div className="pt-4 pb-3 border-b border-[var(--color-border-primary)]">
            <p className="text-center text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              {visibleGroups.find(g => g.id === openGroupId)?.label}
            </p>
          </div>
          <div className="px-2 py-4">
            <div className="space-y-2">
              {visibleGroups.find(g => g.id === openGroupId)?.items.map((item) => {
                const itemActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-start w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      itemActive
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                    role="menuitem"
                    onClick={() => setOpenGroupId(null)}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        itemActive
                          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] group-hover:bg-[var(--color-bg-hover)]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="ml-3 flex-1 text-left truncate">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
}
