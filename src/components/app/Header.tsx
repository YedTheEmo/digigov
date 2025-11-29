"use client";

import { usePathname } from 'next/navigation';
import { UserMenu } from './UserMenu';
import { useEffect, useState } from 'react';
import { GlobalSearch } from './GlobalSearch';
import { AIAssistantLauncher } from './AIAssistantLauncher';
import { useKeybinds } from '@/hooks/useKeybinds';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
}

const pageTitles: Record<string, string> = {
  '/procurement': 'Procurement',
  '/supply': 'Supply Management',
  '/budget': 'Budget Management',
  '/accounting': 'Accounting',
  '/cashier': 'Cashier',
  '/logs': 'Activity Logs',
  '/search': 'Search',
  '/admin': 'Administration',
};

export function Header({ userName, userEmail }: HeaderProps) {
  const pathname = usePathname();
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const { keybinds, getActiveKey, executeAction } = useKeybinds();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Find matching keybind
      const pressedKeys: string[] = [];
      if (event.ctrlKey || event.metaKey) pressedKeys.push('ctrl');
      if (event.shiftKey) pressedKeys.push('shift');
      if (event.altKey) pressedKeys.push('alt');
      pressedKeys.push(event.key.toLowerCase());
      
      const pressedCombo = pressedKeys.join('+');
      
      const matchedKeybind = keybinds.find(kb => getActiveKey(kb) === pressedCombo);
      
      if (matchedKeybind) {
        event.preventDefault();
        if (matchedKeybind.action === 'search') {
          setGlobalSearchOpen(true);
        } else {
          executeAction(matchedKeybind.action);
        }
      }
    };
    
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [keybinds, getActiveKey, executeAction]);
  
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];
    
    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = pageTitles[href] || path.charAt(0).toUpperCase() + path.slice(1);
      breadcrumbs.push({ label, href });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const shouldShowBreadcrumbs = breadcrumbs.length > 1;

  return (
    <>
      <header className="flex-shrink-0 h-16 flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center gap-3 flex-1 min-w-0 px-4 md:px-6">
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-xs font-bold text-white">
              DG
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
                DigiGov
              </span>
              {breadcrumbs[0] && (
                <span className="text-[11px] text-[var(--color-text-tertiary)] leading-tight">
                  {breadcrumbs[0].label}
                </span>
              )}
            </div>
          </div>

          {shouldShowBreadcrumbs && (
            <nav
              className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] overflow-x-auto md:ml-4"
              aria-label="Breadcrumb"
            >
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.href} className="flex items-center gap-2 flex-shrink-0">
                  {index > 0 && <span>/</span>}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-[var(--color-text-primary)] font-medium">{crumb.label}</span>
                  ) : (
                    <a
                      href={crumb.href}
                      className="hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      {crumb.label}
                    </a>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 px-4 md:px-6 h-16">
          {/* Program-wide search trigger */}
          <button
            type="button"
            onClick={() => setGlobalSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)] px-3 h-9 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-[var(--color-text-secondary)] whitespace-nowrap">Search Program</span>
            <span className="inline-flex items-center gap-0.5 rounded border border-[var(--color-border-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-tertiary)] flex-shrink-0">
              <span className="font-mono text-[9px]">Ctrl</span>
              <span className="font-mono text-[9px]">+</span>
              <span className="font-mono text-[9px]">K</span>
            </span>
          </button>

          <AIAssistantLauncher />

          <UserMenu name={userName} email={userEmail} />
        </div>
      </header>

      <GlobalSearch open={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
    </>
  );
}
