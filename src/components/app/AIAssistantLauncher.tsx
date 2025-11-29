"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function AIAssistantLauncher() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder – wire up to real AI backend later.
    if (!prompt.trim()) return;
    setPrompt('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-3 text-xs rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors flex-shrink-0"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white flex-shrink-0">
          AI
        </span>
        <span className="whitespace-nowrap">Ask DigiGov</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/30"
          role="dialog"
          aria-modal="true"
          aria-label="AI Assistant"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-full w-full max-w-md bg-[var(--color-bg-primary)] border-l border-[var(--color-border-primary)] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-primary)]">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">AI Assistant</h2>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Ask &quot;how do I…&quot; questions about DigiGov workflows and features.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                aria-label="Close AI assistant"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>
            <div className="flex-1 px-4 py-3 overflow-y-auto text-xs text-[var(--color-text-tertiary)]">
              <p>
                AI responses will appear here once integrated. For now, this panel is a placeholder for the
                upcoming assistant experience.
              </p>
              <ul className="mt-3 space-y-1 list-disc list-inside">
                <li>&quot;Explain the procurement workflow stages.&quot;</li>
                <li>&quot;Show me where to update a case&apos;s owner.&quot;</li>
                <li>&quot;How do I generate a budget utilization report?&quot;</li>
              </ul>
            </div>
            <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-[var(--color-border-primary)]">
              <div className="flex items-end gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="Ask a question about DigiGov…"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  className="h-9 px-3 text-xs rounded-full"
                  disabled={!prompt.trim()}
                >
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


