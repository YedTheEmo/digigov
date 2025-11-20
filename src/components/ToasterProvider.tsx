'use client';

import { Toaster } from 'react-hot-toast';

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#111827',
          color: '#f9fafb',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#052e16',
          },
        },
        error: {
          iconTheme: {
            primary: '#f97373',
            secondary: '#450a0a',
          },
        },
      }}
    />
  );
}


