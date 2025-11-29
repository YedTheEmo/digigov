import './globals.css';
import type { Metadata } from 'next';
import { ToasterProvider } from '@/components/ToasterProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: {
    default: 'DigiGov',
    template: '%s – DigiGov',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider>
          <a href="#main-content" className="skip-to-main">
            Skip to main content
          </a>
          <ToasterProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
