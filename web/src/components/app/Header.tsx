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
  
  // Get page title from pathname
  const getPageTitle = () => {
    // Check for exact match
    if (pageTitles[pathname]) return pageTitles[pathname];
    
    // Check for nested routes
    const baseRoute = '/' + pathname.split('/')[1];
    if (pageTitles[baseRoute]) return pageTitles[baseRoute];
    
    return 'Dashboard';
  };

  // Generate breadcrumbs
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

  return (
    <header className="flex-shrink-0 h-20 flex items-center justify-between px-8 lg:px-12 bg-white dark:bg-[#1a1d23] border-b border-gray-200 dark:border-[#2d3139] shadow-sm">
      <div className="flex-1 min-w-0 pr-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">{getPageTitle()}</h1>
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1.5 overflow-x-auto" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-2 flex-shrink-0">
                {index > 0 && <span>/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-900 dark:text-gray-100">{crumb.label}</span>
                ) : (
                  <a href={crumb.href} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    {crumb.label}
                  </a>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
      
      <div className="flex items-center gap-4 flex-shrink-0">
        <UserMenu name={userName} email={userEmail} />
      </div>
    </header>
  );
}
