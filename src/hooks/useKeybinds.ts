"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type KeybindAction =
  | 'search'
  | 'goto_cases'
  | 'goto_procurement'
  | 'goto_supply'
  | 'goto_budget'
  | 'goto_accounting'
  | 'goto_cashier'
  | 'goto_finance'
  | 'goto_insights'
  | 'goto_admin';

export type Keybind = {
  action: KeybindAction;
  label: string;
  description: string;
  defaultKey: string;
  customKey?: string;
};

const DEFAULT_KEYBINDS: Keybind[] = [
  {
    action: 'search',
    label: 'Open Search',
    description: 'Open the global search dialog',
    defaultKey: 'ctrl+k',
  },
  {
    action: 'goto_cases',
    label: 'Go to Cases',
    description: 'Navigate to the Cases page',
    defaultKey: 'ctrl+shift+c',
  },
  {
    action: 'goto_procurement',
    label: 'Go to Procurement',
    description: 'Navigate to the Procurement page',
    defaultKey: 'ctrl+shift+p',
  },
  {
    action: 'goto_supply',
    label: 'Go to Supply',
    description: 'Navigate to the Supply page',
    defaultKey: 'ctrl+shift+s',
  },
  {
    action: 'goto_budget',
    label: 'Go to Budget',
    description: 'Navigate to the Budget page',
    defaultKey: 'ctrl+shift+b',
  },
  {
    action: 'goto_accounting',
    label: 'Go to Accounting',
    description: 'Navigate to the Accounting page',
    defaultKey: 'ctrl+shift+a',
  },
  {
    action: 'goto_cashier',
    label: 'Go to Cashier',
    description: 'Navigate to the Cashier page',
    defaultKey: 'ctrl+shift+h',
  },
  {
    action: 'goto_finance',
    label: 'Go to Finance',
    description: 'Navigate to the Finance hub',
    defaultKey: 'ctrl+shift+f',
  },
  {
    action: 'goto_insights',
    label: 'Go to Insights',
    description: 'Navigate to the Insights page',
    defaultKey: 'ctrl+shift+i',
  },
  {
    action: 'goto_admin',
    label: 'Go to Admin',
    description: 'Navigate to the Admin page',
    defaultKey: 'ctrl+shift+d',
  },
];

const STORAGE_KEY = 'digigov-keybinds';

export function useKeybinds() {
  const router = useRouter();
  const [keybinds, setKeybinds] = useState<Keybind[]>(DEFAULT_KEYBINDS);

  // Load custom keybinds from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const custom = JSON.parse(stored);
        setKeybinds((prev) =>
          prev.map((kb) => ({
            ...kb,
            customKey: custom[kb.action] || kb.customKey,
          }))
        );
      } catch {
        // Invalid storage, ignore
      }
    }
  }, []);

  // Save custom keybinds to localStorage
  const updateKeybind = (action: KeybindAction, newKey: string) => {
    const custom: Record<string, string> = {};
    keybinds.forEach((kb) => {
      if (kb.customKey) custom[kb.action] = kb.customKey;
    });
    custom[action] = newKey;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    
    setKeybinds((prev) =>
      prev.map((kb) =>
        kb.action === action ? { ...kb, customKey: newKey } : kb
      )
    );
  };

  const resetKeybind = (action: KeybindAction) => {
    const custom: Record<string, string> = {};
    keybinds.forEach((kb) => {
      if (kb.customKey && kb.action !== action) custom[kb.action] = kb.customKey;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    
    setKeybinds((prev) =>
      prev.map((kb) =>
        kb.action === action ? { ...kb, customKey: undefined } : kb
      )
    );
  };

  const resetAllKeybinds = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKeybinds(DEFAULT_KEYBINDS);
  };

  // Get the active key for a keybind
  const getActiveKey = (keybind: Keybind) => keybind.customKey || keybind.defaultKey;

  // Execute keybind action
  const executeAction = (action: KeybindAction) => {
    const actions: Record<KeybindAction, () => void> = {
      search: () => {
        // Handled by Header component
      },
      goto_cases: () => router.push('/cases'),
      goto_procurement: () => router.push('/procurement'),
      goto_supply: () => router.push('/supply'),
      goto_budget: () => router.push('/budget'),
      goto_accounting: () => router.push('/accounting'),
      goto_cashier: () => router.push('/cashier'),
      goto_finance: () => router.push('/finance'),
      goto_insights: () => router.push('/insights'),
      goto_admin: () => router.push('/admin'),
    };

    actions[action]?.();
  };

  return {
    keybinds,
    updateKeybind,
    resetKeybind,
    resetAllKeybinds,
    getActiveKey,
    executeAction,
  };
}
