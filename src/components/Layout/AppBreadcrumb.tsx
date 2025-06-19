
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from 'lucide-react';

const AppBreadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getBreadcrumbName = (segment: string, index: number) => {
    const fullPath = '/' + pathSegments.slice(0, index + 1).join('/');
    
    const routeNames: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/funksjoner': 'Funksjoner',
      '/klienter': 'Klienter',
      '/clients': 'Klienter',
      '/analyser': 'Analyser',
      '/fag': 'Fagstoff',
      '/knowledge': 'Fagstoff',
      '/innstillinger': 'Innstillinger',
      '/organization/settings': 'Innstillinger',
      '/hjelp': 'Hjelp',
      '/ai-usage': 'AI-bruk',
      '/ai-revy-admin': 'AI-Revy Admin',
      '/communication': 'Kommunikasjon',
      '/teams': 'Teams',
      '/training': 'Opplæring',
      '/documents': 'Dokumenter',
      '/ledger': 'Reskontro',
      '/accounting': 'Regnskap',
      '/data-import': 'Dataimport',
      '/audit-logs': 'Revisjonslogger'
    };

    return routeNames[fullPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  if (location.pathname === '/' || location.pathname === '/dashboard') {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const fullPath = '/' + pathSegments.slice(0, index + 1).join('/');
          const breadcrumbName = getBreadcrumbName(segment, index);

          return (
            <React.Fragment key={fullPath}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{breadcrumbName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={fullPath}>{breadcrumbName}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default AppBreadcrumb;
