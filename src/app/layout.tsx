import './globals.css';
import { ToasterProvider } from '@/components/ToasterProvider';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
