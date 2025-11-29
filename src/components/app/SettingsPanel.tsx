"use client";

import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useKeybinds, type KeybindAction } from '@/hooks/useKeybinds';
import { useState } from 'react';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'appearance' | 'keybinds';

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const {
    mode,
    setMode,
    visualTheme,
    setVisualTheme,
    density,
    setDensity,
    palette,
    setPalette,
    sidebarCollapsedByDefault,
    setSidebarCollapsedByDefault,
  } = useTheme();

  const {
    keybinds,
    updateKeybind,
    resetKeybind,
    resetAllKeybinds,
    getActiveKey,
  } = useKeybinds();

  const [editingKeybind, setEditingKeybind] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);

  const handleKeyRecord = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const keys: string[] = [];
    if (e.ctrlKey || e.metaKey) keys.push('ctrl');
    if (e.shiftKey) keys.push('shift');
    if (e.altKey) keys.push('alt');
    
    const key = e.key.toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      keys.push(key);
      const keybind = keys.join('+');
      if (editingKeybind) {
        updateKeybind(editingKeybind as KeybindAction, keybind);
        setEditingKeybind(null);
        setRecordedKeys([]);
      }
    } else {
      setRecordedKeys(keys);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>Appearance & Settings</ModalHeader>
      
      {/* Tabs */}
      <div className="border-b border-[var(--color-border-primary)] px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('keybinds')}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'keybinds'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Keybinds
          </button>
        </div>
      </div>

      <ModalBody className="space-y-8">
        {activeTab === 'appearance' && (
          <>
            {/* Color mode */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                Color Mode
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Switch between light and dark modes. This applies across all themes.
              </p>
              <div className="inline-flex rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] p-1">
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    mode === 'light'
                      ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={`ml-1 px-4 py-2 text-sm rounded-md transition-colors ${
                    mode === 'dark'
                      ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Dark
                </button>
              </div>
            </section>

            {/* Visual theme */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                Visual Theme
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Choose between modern and legacy DigiGov layouts.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setVisualTheme('modern-hub')}
                  className={`flex flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors ${
                    visualTheme === 'modern-hub'
                      ? 'border-[var(--color-primary)] bg-[var(--color-bg-primary)] shadow-sm'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    Modern
                  </span>
                  <span className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Cleaner cards, more spacing, and streamlined navigation.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisualTheme('legacy-gov')}
                  className={`flex flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors ${
                    visualTheme === 'legacy-gov'
                      ? 'border-[var(--color-primary)] bg-[var(--color-bg-primary)] shadow-sm'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    Legacy
                  </span>
                  <span className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Traditional layout with denser presentation.
                  </span>
                </button>
              </div>
            </section>

            {/* Color palette */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                Color Palette
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Choose the primary accent color for buttons, badges, and navigation.
              </p>
              <div className="grid gap-3 md:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setPalette('emerald')}
                  className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
                    palette === 'emerald'
                      ? 'border-[var(--color-primary)] bg-[var(--color-bg-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span 
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: '#059669', borderColor: '#047857' }}
                    />
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">
                      Emerald
                    </span>
                  </span>
                  <span className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Fresh green accent
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPalette('blue')}
                  className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
                    palette === 'blue'
                      ? 'border-[var(--color-primary)] bg-[var(--color-bg-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span 
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: '#2563eb', borderColor: '#1d4ed8' }}
                    />
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">
                      Blue
                    </span>
                  </span>
                  <span className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Professional blue accent
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPalette('violet')}
                  className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
                    palette === 'violet'
                      ? 'border-[var(--color-primary)] bg-[var(--color-bg-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span 
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: '#7c3aed', borderColor: '#6d28d9' }}
                    />
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">
                      Violet
                    </span>
                  </span>
                  <span className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Calmer violet accent
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPalette('neutral')}
                  className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
                    palette === 'neutral'
                      ? 'border-[var(--color-primary)] bg-[var(--color-bg-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span 
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: '#4b5563', borderColor: '#374151' }}
                    />
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">
                      Neutral
                    </span>
                  </span>
                  <span className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Subtle gray accent
                  </span>
                </button>
              </div>
            </section>

            {/* Density */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                Layout Density
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Control the spacing used in tables, forms, and cards.
              </p>
              <div className="inline-flex rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] p-1">
                <button
                  type="button"
                  onClick={() => setDensity('comfortable')}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    density === 'comfortable'
                      ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Comfortable
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={`ml-1 px-4 py-2 text-sm rounded-md transition-colors ${
                    density === 'compact'
                      ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Compact
                </button>
              </div>
            </section>

            {/* Sidebar behavior */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                Sidebar Behavior
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Choose whether the sidebar starts in its compact, icon-only state or expanded with labels.
              </p>
              <label className="inline-flex items-center gap-3 text-sm text-[var(--color-text-primary)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--color-border-primary)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  checked={sidebarCollapsedByDefault}
                  onChange={(e) => setSidebarCollapsedByDefault(e.target.checked)}
                />
                <span>Start with sidebar collapsed (icon rail)</span>
              </label>
            </section>
          </>
        )}

        {activeTab === 'keybinds' && (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                    Keyboard Shortcuts
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Customize keyboard shortcuts to navigate and perform actions quickly.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllKeybinds}
                >
                  Reset All
                </Button>
              </div>

              <div className="space-y-2 mt-4">
                {keybinds.map((keybind) => (
                  <div
                    key={keybind.action}
                    className="flex items-center justify-between py-3 px-4 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">
                        {keybind.label}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {keybind.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingKeybind === keybind.action ? (
                        <input
                          type="text"
                          autoFocus
                          readOnly
                          value={recordedKeys.join(' + ') || 'Press keys...'}
                          onKeyDown={handleKeyRecord}
                          onBlur={() => {
                            setEditingKeybind(null);
                            setRecordedKeys([]);
                          }}
                          className="px-3 py-1.5 text-xs font-mono rounded border border-[var(--color-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-w-[120px]"
                        />
                      ) : (
                        <>
                          <kbd className="px-3 py-1.5 text-xs font-mono rounded border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
                            {getActiveKey(keybind).split('+').join(' + ')}
                          </kbd>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingKeybind(keybind.action)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          {keybind.customKey && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resetKeybind(keybind.action)}
                              className="text-xs"
                            >
                              Reset
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </ModalFooter>
    </Modal>
  );
}



