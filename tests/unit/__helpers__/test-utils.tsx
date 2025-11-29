import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';

/**
 * Custom render function that wraps components with necessary providers
 * Use this instead of the default render from @testing-library/react
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with our custom implementation
export { customRender as render };

