"use client";

import { usePathname } from 'next/navigation';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
}

const pageTitles: Record<string, string> = {
  '/procurement': 'Procurement',
  '/supply': 'Supply Management',
  '/budget': 'Budget Management',
  '/accounting': 'Accounting',
  '/cashier': 'Cashier',
  '/logs': 'Activity Logs',
  '/search': 'Search',
  '/admin': 'Administration',
};

export function Header({ userName, userEmail }: HeaderProps) {
  const pathname = usePathname();
  
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];
    
    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = pageTitles[href] || path.charAt(0).toUpperCase() + path.slice(1);
      breadcrumbs.push({ label, href });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const shouldShowBreadcrumbs = breadcrumbs.length > 1;

  return (
    <header
      className="flex-shrink-0 h-40 flex items-center justify-between border-b border-gray-300 dark:border-gray-700 relative"
      style={{
        backgroundColor: '#c1c1c1',
        backgroundImage: 'url(/philippine-banner.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Semi-transparent overlay to tint the banner */}
      <div className="absolute inset-0 bg-gray-400/30 dark:bg-gray-800/40 -z-10"></div>

      <div className="flex-1 min-w-0 relative z-0 px-4 md:px-8">
        {shouldShowBreadcrumbs && (
          <nav className="flex items-center gap-2 text-sm text-white overflow-x-auto drop-shadow-md" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-2 flex-shrink-0">
                {index > 0 && <span>/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-white font-medium">{crumb.label}</span>
                ) : (
                  <a href={crumb.href} className="hover:text-green-300 transition-colors">
                    {crumb.label}
                  </a>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0 relative z-0 px-4 md:px-8">
        <UserMenu name={userName} email={userEmail} />
      </div>
    </header>
  );
}
