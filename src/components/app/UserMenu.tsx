"use client";

import { signOut } from 'next-auth/react';
import { Dropdown, DropdownItem, DropdownLabel, DropdownDivider } from '@/components/ui/dropdown';

export function UserMenu({ name, email }: { name?: string; email?: string }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() || 'U';

  return (
    <Dropdown
      trigger={
        <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-medium">
            {initials}
          </div>
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      }
    >
      <DropdownLabel title={name || 'User'} subtitle={email} />
      <DropdownDivider />
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
  );
}


