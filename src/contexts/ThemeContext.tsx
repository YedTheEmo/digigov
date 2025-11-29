"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Theme primitives
 *
 * - mode: light/dark (mapped to the `dark` class on <html> and existing `theme` localStorage key)
 * - visualTheme: named visual direction (Legacy vs Modern)
 * - density: layout density (comfortable vs compact) for tables/forms/cards
 * - palette: brand color palette (emerald, blue, violet, neutral)
 */
type ThemeMode = 'light' | 'dark';
type VisualTheme = 'legacy-gov' | 'modern-hub';
type Density = 'comfortable' | 'compact';
type Palette = 'emerald' | 'blue' | 'violet' | 'neutral';

interface ThemeContextType {
  // Color mode
  mode: ThemeMode;
  theme: ThemeMode; // alias for backwards compatibility
  toggleMode: () => void;
  toggleTheme: () => void; // alias
  setMode: (mode: ThemeMode) => void;
  setTheme: (mode: ThemeMode) => void; // alias

  // Visual theme (Legacy Gov vs Modern Hub)
  visualTheme: VisualTheme;
  setVisualTheme: (theme: VisualTheme) => void;

  // Layout density
  density: Density;
  setDensity: (density: Density) => void;

  // Brand color palette
  palette: Palette;
  setPalette: (palette: Palette) => void;

  // Sidebar behavior
  sidebarCollapsedByDefault: boolean;
  setSidebarCollapsedByDefault: (collapsed: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  mode: 'theme-mode',
  // legacy key still used by ThemeToggle and older code
  legacyMode: 'theme',
  visualTheme: 'visual-theme',
  density: 'density',
  palette: 'color-palette',
  sidebarCollapsed: 'sidebar-collapsed-default',
} as const;

function applyModeToDocument(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

function applyVisualThemeToDocument(visualTheme: VisualTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-visual-theme', visualTheme);
}

function applyDensityToDocument(density: Density) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-density', density);
}

function applyPaletteToDocument(palette: Palette) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-palette', palette);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [visualTheme, setVisualThemeState] = useState<VisualTheme>('modern-hub');
  const [density, setDensityState] = useState<Density>('comfortable');
  const [palette, setPaletteState] = useState<Palette>('emerald');
  const [sidebarCollapsedByDefault, setSidebarCollapsedByDefaultState] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      // Resolve mode (light/dark) with backwards-compatible key
      const storedMode = (localStorage.getItem(STORAGE_KEYS.mode) ||
        localStorage.getItem(STORAGE_KEYS.legacyMode)) as ThemeMode | null;
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const initialMode: ThemeMode = storedMode || (prefersDark ? 'dark' : 'light');

      // Resolve visual theme (Legacy Gov vs Modern Hub)
      const storedVisualTheme = localStorage.getItem(STORAGE_KEYS.visualTheme) as VisualTheme | null;
      const initialVisualTheme: VisualTheme = storedVisualTheme || 'modern-hub';

      // Resolve density
      const storedDensity = localStorage.getItem(STORAGE_KEYS.density) as Density | null;
      const initialDensity: Density = storedDensity || 'comfortable';

      // Resolve palette
      const storedPalette = localStorage.getItem(STORAGE_KEYS.palette) as Palette | null;
      const initialPalette: Palette = storedPalette || 'emerald';

      const storedSidebarCollapsed = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
      const initialSidebarCollapsed =
        storedSidebarCollapsed === null ? true : storedSidebarCollapsed === 'true';

      setModeState(initialMode);
      setVisualThemeState(initialVisualTheme);
      setDensityState(initialDensity);
      setPaletteState(initialPalette);
      setSidebarCollapsedByDefaultState(initialSidebarCollapsed);

      applyModeToDocument(initialMode);
      applyVisualThemeToDocument(initialVisualTheme);
      applyDensityToDocument(initialDensity);
      applyPaletteToDocument(initialPalette);
    } catch {
      // Safe fallbacks if localStorage is unavailable
      setModeState('light');
      setVisualThemeState('modern-hub');
      setDensityState('comfortable');
      setPaletteState('emerald');
      setSidebarCollapsedByDefaultState(true);
      applyModeToDocument('light');
      applyVisualThemeToDocument('modern-hub');
      applyDensityToDocument('comfortable');
      applyPaletteToDocument('emerald');
    }
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    try {
      localStorage.setItem(STORAGE_KEYS.mode, nextMode);
      // Keep legacy key in sync so existing code that reads `theme` still works
      localStorage.setItem(STORAGE_KEYS.legacyMode, nextMode);
    } catch {
      // Ignore storage errors
    }
    applyModeToDocument(nextMode);
  };

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const setVisualTheme = (nextVisualTheme: VisualTheme) => {
    setVisualThemeState(nextVisualTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.visualTheme, nextVisualTheme);
    } catch {
      // Ignore storage errors
    }
    applyVisualThemeToDocument(nextVisualTheme);
  };

  const setDensity = (nextDensity: Density) => {
    setDensityState(nextDensity);
    try {
      localStorage.setItem(STORAGE_KEYS.density, nextDensity);
    } catch {
      // Ignore storage errors
    }
    applyDensityToDocument(nextDensity);
  };

  const setPalette = (nextPalette: Palette) => {
    setPaletteState(nextPalette);
    try {
      localStorage.setItem(STORAGE_KEYS.palette, nextPalette);
    } catch {
      // Ignore storage errors
    }
    applyPaletteToDocument(nextPalette);
  };

  const setSidebarCollapsedByDefault = (collapsed: boolean) => {
    setSidebarCollapsedByDefaultState(collapsed);
    try {
      localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(collapsed));
    } catch {
      // Ignore storage errors
    }
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: mode,
        toggleMode,
        toggleTheme: toggleMode,
        setMode,
        setTheme: setMode,
        visualTheme,
        setVisualTheme,
        density,
        setDensity,
        palette,
        setPalette,
        sidebarCollapsedByDefault,
        setSidebarCollapsedByDefault,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Fallback for components rendered outside ThemeProvider (e.g. in tests or
    // non-wrapped trees). Provides sane defaults and no-ops.
    return {
      mode: 'light' as ThemeMode,
      theme: 'light' as ThemeMode,
      toggleMode: () => {},
      toggleTheme: () => {},
      setMode: () => {},
      setTheme: () => {},
      visualTheme: 'modern-hub' as VisualTheme,
      setVisualTheme: () => {},
      density: 'comfortable' as Density,
      setDensity: () => {},
      palette: 'emerald' as Palette,
      setPalette: () => {},
      sidebarCollapsedByDefault: true,
      setSidebarCollapsedByDefault: () => {},
    };
  }
  return context;
}

