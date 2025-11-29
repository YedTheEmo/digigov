"use client";

import { signOut } from 'next-auth/react';
import { Dropdown, DropdownItem, DropdownLabel, DropdownDivider } from '@/components/ui/dropdown';
import { useState } from 'react';
import { SettingsPanel } from './SettingsPanel';

export function UserMenu({ name, email }: { name?: string; email?: string }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      <Dropdown
        trigger={
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <svg className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        }
      >
        <DropdownLabel title={name || 'User'} subtitle={email} />
        <DropdownDivider />
        <DropdownItem
          onClick={() => setSettingsOpen(true)}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l.444 1.368a1 1 0 00.95.69h1.443c.969 0 1.371 1.24.588 1.81l-1.168.848a1 1 0 00-.364 1.118l.445 1.368c.3.922-.755 1.688-1.54 1.118l-1.168-.848a1 1 0 00-1.176 0l-1.168.848c-.784.57-1.838-.196-1.539-1.118l.445-1.368a1 1 0 00-.364-1.118l-1.168-.848c-.783-.57-.38-1.81.588-1.81h1.444a1 1 0 00.95-.69l.444-1.368z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9.75a3 3 0 100 6 3 3 0 000-6z" />
            </svg>
          }
        >
          Appearance & Settings
        </DropdownItem>
        <DropdownItem
          onClick={() => signOut({ callbackUrl: '/login' })}
          destructive
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
        >
          Sign out
        </DropdownItem>
      </Dropdown>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}


