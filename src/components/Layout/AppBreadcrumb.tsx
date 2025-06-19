
import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from 'lucide-react';
import { useClientDetails } from '@/hooks/useClientDetails';

const AppBreadcrumb = () => {
  const location = useLocation();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client } = useClientDetails(orgNumber || '');
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Simple route name mapping
  const getRouteName = (segment: string) => {
    const routeNames: Record<string, string> = {
      'dashboard': 'Dashboard',
      'klienter': 'Klienter',
      'regnskap': 'Regnskap',
      'analyser': 'Analyser',
      'regnskapsdata': 'Regnskapsdata',
      'spesialdata': 'Spesialdata',
      'transaksjoner': 'Transaksjoner',
      'import': 'Import',
      'organization': 'Organisasjon',
      'teams': 'Teams',
      'fag': 'Fagstoff',
      'ai-usage': 'AI-bruk',
    };
    
    // If it's an org number and we have client data, use client name
    if (segment.match(/^\d+$/) && client) {
      return client.company_name || client.name;
    }
    
    return routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  // Handle root/dashboard case
  if (location.pathname === '/' || location.pathname === '/dashboard') {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1 text-sidebar-foreground">
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
            <Link to="/dashboard" className="flex items-center gap-1 text-sidebar-foreground hover:text-sidebar-primary">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const fullPath = '/' + pathSegments.slice(0, index + 1).join('/');
          const breadcrumbName = getRouteName(segment);

          return (
            <React.Fragment key={fullPath}>
              <BreadcrumbSeparator className="text-sidebar-foreground/60" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-sidebar-foreground">{breadcrumbName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={fullPath} className="text-sidebar-foreground hover:text-sidebar-primary">{breadcrumbName}</Link>
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
